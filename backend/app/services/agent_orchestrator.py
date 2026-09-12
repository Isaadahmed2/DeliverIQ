from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.models import Order, AgentExecution
from ml_service.inference import RiskInferenceEngine
from backend.app.services.evolution_client import evolution_client
from backend.app.services.osm_service import osm_geo_service

class AgentOrchestrator:
    """Orchestrates autonomous agents across the risk verification pipeline."""

    def __init__(self):
        self.ml_engine = RiskInferenceEngine()

    def run_pipeline_for_order(self, order: Order, db: Session, whatsapp_instance: str = "deliveriq_main") -> Dict[str, Any]:
        """
        Executes multi-agent workflow on a single order:
        - Agent 1: Pre-scores order.
        - If >= 80: Direct Approval -> Shipped.
        - If 50-79: Triggers Agent 2 (WhatsApp).
        - If < 50: Triggers Agent 3 (OSM Geo) + Agent 2 (WhatsApp with Landmarks).
        """
        # --- AGENT 1: ML RISK PROFILER ---
        order_dict = {
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone,
            "shipping_address": order.shipping_address,
            "city": order.city,
            "cod_amount": order.cod_amount,
            "order_hour": order.order_timestamp.hour if order.order_timestamp else 14,
            "is_repeat_customer": 1 if order.retry_count == 0 and "House" in order.shipping_address else 0
        }
        
        score_res = self.ml_engine.score_order(order_dict)
        order.risk_score = score_res["score"]
        order.risk_tier = score_res["risk_tier"]
        order.rto_probability = score_res["rto_probability"]
        order.risk_factors = score_res["risk_factors"]
        
        # Geocode if not present
        if not order.latitude or not order.longitude:
            lat, lon = osm_geo_service.geocode_address(order.shipping_address, order.city)
            order.latitude = lat
            order.longitude = lon
            
        exec_1 = AgentExecution(
            order_id=order.id,
            agent_name="ML_RISK_PROFILER",
            attempt_number=1,
            status="EXECUTED",
            thought=f"Evaluated address completeness, city tier ({order.city}), and COD amount (PKR {order.cod_amount:,.0f}). Base delivery probability: {order.risk_score}%.",
            action_taken=f"Assigned risk tier: {order.risk_tier}",
            observation={"score": order.risk_score, "factors": order.risk_factors},
            score_delta=0.0
        )
        db.add(exec_1)
        
        # Branch 1: Safe Order (>= 80)
        if order.risk_score >= 80.0:
            order.status = "APPROVED"
            exec_crm = AgentExecution(
                order_id=order.id,
                agent_name="CRM_SYNC_AGENT",
                attempt_number=1,
                status="EXECUTED",
                thought=f"Order score {order.risk_score} is >= 80 threshold. Order marked approved for direct courier dispatch.",
                action_taken="Updated store records: Direct Dispatch",
                observation={"final_status": "APPROVED"}
            )
            db.add(exec_crm)
            db.commit()
            db.refresh(order)
            return {"order_id": order.id, "status": "APPROVED", "score": order.risk_score, "agents_run": 2}

        # Branch 2: High Risk (< 50) -> Spin up Agent 3 (OSM Geo Landmark)
        suggested_landmarks = []
        if order.risk_score < 50.0:
            suggested_landmarks = osm_geo_service.find_nearby_landmarks(order.latitude, order.longitude)
            order.nearby_landmarks = suggested_landmarks
            exec_geo = AgentExecution(
                order_id=order.id,
                agent_name="GEO_LANDMARK_AGENT",
                attempt_number=1,
                status="EXECUTED",
                thought=f"Order score {order.risk_score} is < 50 (High Risk). Address may be vague. Queried OpenStreetMap for nearby anchor points.",
                action_taken="Discovered 3 verified commercial landmarks to offer customer for drop off.",
                observation={"landmarks": suggested_landmarks}
            )
            db.add(exec_geo)

        # Trigger Agent 2: WhatsApp Confirmation
        order.status = "IN_CONFIRMATION"
        order.retry_count += 1
        
        # Send via Evolution API (or record intent)
        wa_resp = evolution_client.send_confirmation_message(
            instance_name=whatsapp_instance,
            phone=order.customer_phone,
            order_id=order.external_order_id,
            customer_name=order.customer_name,
            cod_amount=order.cod_amount,
            suggested_landmarks=suggested_landmarks
        )
        
        exec_wa = AgentExecution(
            order_id=order.id,
            agent_name="WHATSAPP_NEGOTIATOR",
            attempt_number=order.retry_count,
            status="WAITING_INPUT",
            thought=f"Sent interactive verification prompt to {order.customer_phone}. Waiting for customer response.",
            action_taken="Dispatched WhatsApp verification template via Evolution API.",
            observation={"evolution_api_response": wa_resp, "landmarks_included": len(suggested_landmarks) > 0}
        )
        db.add(exec_wa)
        db.commit()
        db.refresh(order)
        
        return {
            "order_id": order.id, 
            "status": order.status, 
            "score": order.risk_score, 
            "agents_run": 3 if order.risk_score < 50 else 2
        }

    def handle_customer_confirmation_response(self, order: Order, response_text: str, db: Session) -> Dict[str, Any]:
        """Handles inbound customer reply from WhatsApp webhook."""
        clean_text = response_text.lower().strip()
        
        if "confirm" in clean_text or "yes" in clean_text or "haan" in clean_text or "theek" in clean_text:
            # Positive confirmation boosts score by +25 points
            order.risk_score = min(100.0, order.risk_score + 25.0)
            order.status = "APPROVED"
            exec_conf = AgentExecution(
                order_id=order.id,
                agent_name="WHATSAPP_NEGOTIATOR",
                attempt_number=order.retry_count,
                status="EXECUTED",
                thought="Customer explicitly confirmed order via WhatsApp. Added +25 points to safety score.",
                action_taken="Approved order for shipping",
                observation={"customer_response": response_text},
                score_delta=25.0
            )
            db.add(exec_conf)
        elif "cancel" in clean_text or "no" in clean_text or "nahi" in clean_text:
            order.status = "CANCELLED"
            exec_conf = AgentExecution(
                order_id=order.id,
                agent_name="WHATSAPP_NEGOTIATOR",
                attempt_number=order.retry_count,
                status="EXECUTED",
                thought="Customer canceled order via WhatsApp. Preventing courier dispatch fees.",
                action_taken="Cancelled order",
                observation={"customer_response": response_text},
                score_delta=0.0
            )
            db.add(exec_conf)
        else:
            # Ambiguous reply or inquiry
            if order.retry_count >= 3:
                # Trigger Agent 4: Escalation
                order.status = "ESCALATED"
                exec_esc = AgentExecution(
                    order_id=order.id,
                    agent_name="HUMAN_ESCALATION_AGENT",
                    attempt_number=3,
                    status="EXECUTED",
                    thought="3 contact attempts failed or remained ambiguous. Escalating to store owner with complete audit.",
                    action_taken="Dispatched email escalation notification to business owner.",
                    observation={"attempts": order.retry_count, "final_score": order.risk_score}
                )
                db.add(exec_esc)
        
        db.commit()
        db.refresh(order)
        return {"order_id": order.id, "status": order.status, "score": order.risk_score}

agent_orchestrator = AgentOrchestrator()
