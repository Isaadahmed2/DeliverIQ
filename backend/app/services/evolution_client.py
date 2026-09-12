import requests
import os
from typing import Dict, Any, Optional, List
from backend.app.core.config import settings

class EvolutionAPIClient:
    """Client for self-hosted Evolution API (WhatsApp)."""
    
    def __init__(self, base_url: str = None, api_key: str = None):
        self.base_url = (base_url or settings.EVOLUTION_API_URL).rstrip('/')
        self.api_key = api_key or os.getenv("EVOLUTION_API_KEY", "429683C4C977415CAAFCCE10F7D57E11")
        self.headers = {
            "apikey": self.api_key,
            "Content-Type": "application/json"
        }

    def list_instances(self) -> List[Dict[str, Any]]:
        """Lists all instances in Evolution API."""
        url = f"{self.base_url}/instance/fetchInstances"
        try:
            resp = requests.get(url, headers=self.headers, timeout=5)
            if resp.status_code == 200:
                return resp.json()
            return []
        except Exception as e:
            print("Failed to fetch instances:", e)
            return []

    def get_first_connected_instance(self) -> Optional[str]:
        """Auto-detects open/connected WhatsApp instance specifically for DeliverIQ."""
        instances = self.list_instances()
        for inst in instances:
            name = inst.get("name", "")
            if name.startswith("deliveriq_") and inst.get("connectionStatus") == "open":
                return name
        return None

    def check_instance_status(self, instance_name: Optional[str] = None) -> Dict[str, Any]:
        """Checks if instance is connected, defaulting to deliveriq_main."""
        if not instance_name or instance_name == "auto":
            connected = self.get_first_connected_instance()
            if connected:
                return {"instance": connected, "state": "open", "connected": True}
            instance_name = "deliveriq_main"

        url = f"{self.base_url}/instance/connectionState/{instance_name}"
        try:
            resp = requests.get(url, headers=self.headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                state = data.get("instance", {}).get("state", "close")
                return {"instance": instance_name, "state": state, "connected": state == "open"}
            
            connected = self.get_first_connected_instance()
            if connected:
                return {"instance": connected, "state": "open", "connected": True}
                
            return {"instance": instance_name, "state": "disconnected", "connected": False}
        except Exception as e:
            return {"instance": instance_name, "state": "unavailable", "connected": False, "error": str(e)}

    def create_instance(self, instance_name: str = "deliveriq_main") -> Dict[str, Any]:
        """Creates a dedicated DeliverIQ instance if it doesn't exist."""
        url = f"{self.base_url}/instance/create"
        payload = {
            "instanceName": instance_name,
            "qrcode": True,
            "integration": "WHATSAPP-BAILEYS"
        }
        try:
            resp = requests.post(url, json=payload, headers=self.headers, timeout=8)
            return resp.json() if resp.status_code in [200, 201] else {"error": resp.text}
        except Exception as e:
            return {"error": str(e)}

    def get_qr_code(self, instance_name: str = "deliveriq_main") -> Dict[str, Any]:
        """Fetches fresh QR code for deliveriq_main instance."""
        status = self.check_instance_status(instance_name)
        if status.get("connected"):
            return {"instance": instance_name, "connected": True, "message": f"Already connected via {instance_name}"}

        url = f"{self.base_url}/instance/connect/{instance_name}"
        try:
            resp = requests.get(url, headers=self.headers, timeout=8)
            if resp.status_code in [200, 201]:
                return resp.json()
            elif resp.status_code == 404:
                self.create_instance(instance_name)
                resp2 = requests.get(url, headers=self.headers, timeout=8)
                if resp2.status_code in [200, 201]:
                    return resp2.json()
            return {"error": f"Failed to get QR: HTTP {resp.status_code}", "raw": resp.text}
        except Exception as e:
            return {"error": f"Evolution API connection failed: {str(e)}"}

    def logout_instance(self, instance_name: str = "deliveriq_main") -> Dict[str, Any]:
        """Logs out from an active WhatsApp instance."""
        url = f"{self.base_url}/instance/logout/{instance_name}"
        try:
            resp = requests.delete(url, headers=self.headers, timeout=8)
            return resp.json() if resp.status_code in [200, 201] else {"error": resp.text}
        except Exception as e:
            return {"error": str(e)}

    # User Safety Guardrail: ONLY these numbers may receive real outbound WhatsApp messages
    WHITELISTED_PHONES = {"923455113612", "923410015303"}

    @classmethod
    def normalize_phone(cls, phone: str) -> str:
        """Normalizes Pakistani phone numbers to 923XXXXXXXXX format."""
        digits = "".join(filter(str.isdigit, phone or ""))
        if digits.startswith("03"):
            return "92" + digits[1:]
        elif digits.startswith("3") and len(digits) == 10:
            return "92" + digits
        return digits

    @classmethod
    def is_whitelisted(cls, phone: str) -> bool:
        """Verifies if phone number matches explicitly authorized test numbers."""
        normalized = cls.normalize_phone(phone)
        return normalized in cls.WHITELISTED_PHONES

    def send_confirmation_message(
        self, 
        instance_name: Optional[str], 
        phone: str, 
        order_id: str, 
        customer_name: str, 
        cod_amount: float,
        suggested_landmarks: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Sends WhatsApp confirmation message using connected or specified instance.
        STRICT SAFETY ENFORCEMENT: Never sends real messages to random numbers.
        Only messages explicitly whitelisted numbers: 03455113612 & 03410015303.
        """
        cleaned_phone = self.normalize_phone(phone)

        # Enforce Whitelist Guardrail
        if not self.is_whitelisted(phone):
            return {
                "status": "blocked_by_guardrail",
                "phone": phone,
                "normalized": cleaned_phone,
                "whitelisted": False,
                "message": f"Real WhatsApp dispatch skipped for safety: {phone} is not in the whitelist (03455113612, 03410015303). Outgoing message simulated successfully.",
                "simulated": True
            }

        active_instance = instance_name
        if not active_instance or active_instance == "auto" or active_instance == "deliveriq_main":
            active_instance = self.get_first_connected_instance() or "deliveriq_main"
            
        url = f"{self.base_url}/message/sendText/{active_instance}"
        
        landmark_text = ""
        if suggested_landmarks and len(suggested_landmarks) > 0:
            landmark_text = "\n\n📍 *Qareebi Mashhoor Maqam (Pick-up drop anchor):*\n"
            for i, lm in enumerate(suggested_landmarks[:3], 1):
                landmark_text += f"{i}. {lm.get('name', 'Known Point')} ({lm.get('type', 'Place')})\n"
            landmark_text += "_Agar aap ka ghar dhoondna mushkil ho to rider yahan deliver kar sakta hai._"

        message_body = (
            f"Assalam-o-Alaikum *{customer_name}*! 👋\n\n"
            f"Aap ka Order *#{order_id}* (COD Amount: *PKR {cod_amount:,.0f}*) tayyar hai.\n\n"
            f"Baraye meherbani delivery confirm karne k liye reply karein:\n"
            f"✅ *CONFIRM* — Agar aap order lena chahte hain.\n"
            f"❌ *CANCEL* — Agar aap ko order nahi chahiye."
            f"{landmark_text}\n\n"
            f"— *DeliverIQ AI Verification Team*"
        )
        
        payload = {
            "number": cleaned_phone,
            "options": {"delay": 1200, "presence": "composing"},
            "text": message_body
        }
        
        try:
            resp = requests.post(url, json=payload, headers=self.headers, timeout=8)
            return {
                "status_code": resp.status_code, 
                "instance": active_instance, 
                "whitelisted": True,
                "phone": cleaned_phone,
                "response": resp.json() if resp.status_code == 200 else resp.text
            }
        except Exception as e:
            return {"status": "error", "whitelisted": True, "message": str(e)}

evolution_client = EvolutionAPIClient()
