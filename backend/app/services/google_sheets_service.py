import csv
import io
import re
import requests
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import Order, User
from backend.app.services.agent_orchestrator import agent_orchestrator

class GoogleSheetsSyncService:
    """Parses Google Sheet (either via published CSV link, Sheet ID, or CSV export)."""

    def parse_sheet_url(self, sheet_url: str) -> str:
        """Converts any standard Google Sheets URL into a direct CSV export URL."""
        # Check if already a direct CSV or export URL
        if "export?format=csv" in sheet_url or "output=csv" in sheet_url:
            return sheet_url

        # Match standard Google Sheet ID: /spreadsheets/d/<ID>/
        match = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", sheet_url)
        if match:
            sheet_id = match.group(1)
            # Extract gid if present
            gid_match = re.search(r"[#&]gid=([0-9]+)", sheet_url)
            gid = gid_match.group(1) if gid_match else "0"
            return f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"

        return sheet_url

    def fetch_and_sync_sheet(self, sheet_url: str, user_id: str, db: Session) -> Dict[str, Any]:
        """Fetches rows from Google Sheet and creates/scores orders with multi-agents."""
        csv_url = self.parse_sheet_url(sheet_url)
        
        try:
            resp = requests.get(csv_url, timeout=10)
            if resp.status_code != 200:
                return {
                    "success": False,
                    "error": f"Failed to fetch sheet: HTTP {resp.status_code}. Make sure sheet has 'Anyone with link can view' permission."
                }
                
            content = resp.content.decode('utf-8-sig', errors='replace')
            reader = csv.DictReader(io.StringIO(content))
            
            synced_orders = []
            for row in reader:
                # Flexible column key mapping
                ext_id = row.get('External_Order_ID') or row.get('Order_ID') or row.get('order_id') or row.get('ID')
                name = row.get('Customer_Name') or row.get('Name') or row.get('customer_name') or 'Customer'
                phone = row.get('Customer_Phone') or row.get('Phone') or row.get('customer_phone') or ''
                address = row.get('Shipping_Address') or row.get('Address') or row.get('shipping_address') or ''
                city = row.get('City') or row.get('city') or 'Karachi'
                cod_raw = row.get('COD_Amount') or row.get('Amount') or row.get('cod_amount') or '0'
                
                if not ext_id or not phone:
                    continue
                    
                try:
                    cod_val = float(re.sub(r'[^\d.]', '', str(cod_raw)))
                except ValueError:
                    cod_val = 1500.0
                    
                # Check if order already exists
                existing = db.query(Order).filter(
                    Order.user_id == user_id,
                    Order.external_order_id == ext_id
                ).first()
                
                if not existing:
                    new_order = Order(
                        user_id=user_id,
                        external_order_id=ext_id,
                        customer_name=name,
                        customer_phone=phone,
                        shipping_address=address,
                        city=city,
                        cod_amount=cod_val
                    )
                    db.add(new_order)
                    db.commit()
                    db.refresh(new_order)
                    
                    # Run AI Agents on newly ingested order
                    res = agent_orchestrator.run_pipeline_for_order(new_order, db)
                    synced_orders.append({
                        "order_id": ext_id,
                        "customer": name,
                        "phone": phone,
                        "score": new_order.risk_score,
                        "status": new_order.status
                    })

            return {
                "success": True,
                "synced_count": len(synced_orders),
                "orders": synced_orders
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

google_sheets_service = GoogleSheetsSyncService()
