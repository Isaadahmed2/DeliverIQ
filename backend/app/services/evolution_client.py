import requests
from typing import Dict, Any, Optional
from backend.app.core.config import settings

class EvolutionAPIClient:
    """Client for self-hosted Evolution API (WhatsApp)."""
    
    def __init__(self, base_url: str = None, api_key: str = None):
        self.base_url = (base_url or settings.EVOLUTION_API_URL).rstrip('/')
        self.api_key = api_key or settings.EVOLUTION_API_KEY
        self.headers = {
            "apikey": self.api_key,
            "Content-Type": "application/json"
        }

    def check_instance_status(self, instance_name: str = "deliveriq_main") -> Dict[str, Any]:
        """Checks if the WhatsApp instance is connected or disconnected."""
        url = f"{self.base_url}/instance/connectionState/{instance_name}"
        try:
            resp = requests.get(url, headers=self.headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                state = data.get("instance", {}).get("state", "disconnected")
                return {"instance": instance_name, "state": state, "connected": state == "open"}
            return {"instance": instance_name, "state": "disconnected", "connected": False}
        except Exception as e:
            return {"instance": instance_name, "state": "unavailable", "connected": False, "error": str(e)}

    def get_qr_code(self, instance_name: str = "deliveriq_main") -> Dict[str, Any]:
        """Fetches QR code base64 stream to display on frontend."""
        url = f"{self.base_url}/instance/connect/{instance_name}"
        try:
            resp = requests.get(url, headers=self.headers, timeout=8)
            if resp.status_code in [200, 201]:
                return resp.json()
            return {"error": f"Failed to get QR: HTTP {resp.status_code}", "raw": resp.text}
        except Exception as e:
            return {"error": f"Evolution API connection failed: {str(e)}"}

    def send_confirmation_message(
        self, 
        instance_name: str, 
        phone: str, 
        order_id: str, 
        customer_name: str, 
        cod_amount: float,
        suggested_landmarks: Optional[list] = None
    ) -> Dict[str, Any]:
        """Sends WhatsApp confirmation message with order details & Roman Urdu options."""
        # Sanitize phone to international format: 03001234567 -> 923001234567
        cleaned_phone = phone.replace("+", "").replace("-", "").strip()
        if cleaned_phone.startswith("0"):
            cleaned_phone = "92" + cleaned_phone[1:]
            
        url = f"{self.base_url}/message/sendText/{instance_name}"
        
        # Build Natural Roman Urdu message
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
            return {"status_code": resp.status_code, "response": resp.json() if resp.status_code == 200 else resp.text}
        except Exception as e:
            return {"status": "error", "message": str(e)}

evolution_client = EvolutionAPIClient()
