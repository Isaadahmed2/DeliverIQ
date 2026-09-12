import os
import sys
import unittest

# Append workspace root explicitly to sys.path
workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)

from fastapi.testclient import TestClient
from backend.app.main import app

class TestDeliverIQBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.test_email = "store_owner@karachi-d2c.com"
        cls.test_password = "secure_password_123"

    def test_01_health_check(self):
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "healthy")

    def test_02_register_user(self):
        payload = {
            "email": self.test_email,
            "password": self.test_password,
            "full_name": "Tariq Mahmood",
            "company_name": "Karachi Garments"
        }
        resp = self.client.post("/api/v1/auth/register", json=payload)
        self.assertIn(resp.status_code, [200, 400])

    def test_03_login_and_token(self):
        payload = {
            "email": self.test_email,
            "password": self.test_password
        }
        resp = self.client.post("/api/v1/auth/login", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("access_token", data)
        TestDeliverIQBackend.token = data["access_token"]

    def test_04_create_and_score_order_agentic(self):
        headers = {"Authorization": f"Bearer {TestDeliverIQBackend.token}"}
        
        # Test: High Risk Order (Vague address, remote city, high COD)
        risky_payload = {
            "external_order_id": "ORD-TEST-9901",
            "customer_name": "Test User",
            "customer_phone": "039912345",
            "shipping_address": "main bazar near bridge",
            "city": "Turbat",
            "cod_amount": 22000
        }
        resp = self.client.post("/api/v1/orders/", json=risky_payload, headers=headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        
        self.assertIn("risk_score", data)
        self.assertIn("risk_tier", data)
        self.assertIn("nearby_landmarks", data)
        print(f"\n[Test Result] Risky Order Pre-Score: {data['risk_score']} (Tier: {data['risk_tier']})")
        print(f"[Test Result] Agents Triggered: {[ex['agent_name'] for ex in data.get('agent_executions', [])]}")
        print(f"[Test Result] Nearby Landmarks: {[lm['name'] for lm in data.get('nearby_landmarks', [])]}")

if __name__ == '__main__':
    unittest.main()
