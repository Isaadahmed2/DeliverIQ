from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.models import Order, User
from backend.app.schemas.schemas import OrderCreate, OrderResponse, BatchAgentRunRequest, BatchAgentRunResponse
from backend.app.api.deps import get_current_user
from backend.app.services.agent_orchestrator import agent_orchestrator

router = APIRouter()

@router.get("/", response_model=List[OrderResponse])
def get_orders(
    hours: Optional[int] = Query(None, description="Lookback window in hours (6, 12, 18, 24)"),
    status: Optional[str] = Query(None),
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Order).filter(Order.user_id == current_user.id)
    if hours:
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        query = query.filter(Order.order_timestamp >= since)
    if status:
        query = query.filter(Order.status == status.upper())
        
    orders = query.order_by(Order.order_timestamp.desc()).limit(limit).all()
    return orders

@router.post("/", response_model=OrderResponse)
def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = Order(
        user_id=current_user.id,
        external_order_id=order_in.external_order_id,
        customer_name=order_in.customer_name,
        customer_phone=order_in.customer_phone,
        shipping_address=order_in.shipping_address,
        city=order_in.city,
        cod_amount=order_in.cod_amount,
        order_timestamp=order_in.order_timestamp or datetime.now(timezone.utc)
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Real-time trigger: Run Agent Pipeline on new order
    agent_orchestrator.run_pipeline_for_order(order, db)
    db.refresh(order)
    return order

@router.post("/batch-run", response_model=BatchAgentRunResponse)
def run_batch_agents(
    req: BatchAgentRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Triggers autonomous agents on all pending/in_confirmation orders in the selected lookback window."""
    since = datetime.now(timezone.utc) - timedelta(hours=req.hours)
    orders = db.query(Order).filter(
        Order.user_id == current_user.id,
        Order.order_timestamp >= since
    ).all()
    
    direct_approved = 0
    in_confirmation = 0
    high_risk_flagged = 0
    affected_ids = []
    
    for order in orders:
        res = agent_orchestrator.run_pipeline_for_order(order, db)
        affected_ids.append(order.external_order_id)
        if res["status"] == "APPROVED":
            direct_approved += 1
        elif res["status"] == "IN_CONFIRMATION":
            in_confirmation += 1
        elif res["score"] < 50.0:
            high_risk_flagged += 1
            
    return BatchAgentRunResponse(
        processed_count=len(orders),
        direct_approved=direct_approved,
        in_confirmation=in_confirmation,
        high_risk_flagged=high_risk_flagged,
        orders_affected=affected_ids
    )

@router.post("/{order_id}/simulate-reply")
def simulate_customer_reply(
    order_id: str,
    reply: str = Query(..., description="Reply text: confirm, cancel, or other"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Simulates customer WhatsApp reply for local testing and live demo."""
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    res = agent_orchestrator.handle_customer_confirmation_response(order, reply, db)
    return res
