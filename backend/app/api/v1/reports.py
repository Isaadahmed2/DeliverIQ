from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from backend.app.db.session import get_db
from backend.app.models.models import Order, User
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.get("/metrics")
def get_dashboard_metrics(
    hours: Optional[int] = Query(None, description="Lookback window in hours"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Order).filter(Order.user_id == current_user.id)
    if hours:
        since = datetime.utcnow() - timedelta(hours=hours)
        orders = query.filter(Order.order_timestamp >= since).all()
        # Fallback to all orders if none in narrow window
        if len(orders) == 0:
            orders = query.all()
    else:
        orders = query.all()
    
    total = len(orders)
    if total == 0:
        return {
            "total_orders": 0,
            "average_risk_score": 0.0,
            "delivery_success_rate": 0.0,
            "approved_count": 0,
            "in_confirmation_count": 0,
            "cancelled_count": 0,
            "escalated_count": 0,
            "estimated_pkr_saved": 0.0
        }
        
    avg_score = sum(o.risk_score for o in orders) / total
    approved = sum(1 for o in orders if o.status == "APPROVED")
    in_conf = sum(1 for o in orders if o.status == "IN_CONFIRMATION")
    cancelled = sum(1 for o in orders if o.status == "CANCELLED")
    escalated = sum(1 for o in orders if o.status == "ESCALATED")
    
    pkr_saved = (cancelled * 450.0) + (approved * 150.0)
    success_rate = (approved / total) * 100.0 if total > 0 else 0.0
    
    return {
        "total_orders": total,
        "average_risk_score": round(avg_score, 1),
        "delivery_success_rate": round(success_rate, 1),
        "approved_count": approved,
        "in_confirmation_count": in_conf,
        "cancelled_count": cancelled,
        "escalated_count": escalated,
        "estimated_pkr_saved": pkr_saved
    }
