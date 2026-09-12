from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.models import Integration, User
from backend.app.schemas.schemas import IntegrationUpdate
from backend.app.api.deps import get_current_user
from backend.app.services.evolution_client import evolution_client

router = APIRouter()

@router.get("/whatsapp/status")
def get_whatsapp_status(
    instance_name: str = Query("deliveriq_main"),
    current_user: User = Depends(get_current_user)
):
    """Fetches real-time connection status from local Evolution API on port 8080."""
    return evolution_client.check_instance_status(instance_name)

@router.get("/whatsapp/qr")
def get_whatsapp_qr(
    instance_name: str = Query("deliveriq_main"),
    current_user: User = Depends(get_current_user)
):
    """Retrieves QR code to pair WhatsApp on the frontend."""
    return evolution_client.get_qr_code(instance_name)

@router.get("/")
def list_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Integration).filter(Integration.user_id == current_user.id).all()

@router.post("/")
def save_integration(
    payload: IntegrationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Integration).filter(
        Integration.user_id == current_user.id,
        Integration.provider == payload.provider
    ).first()
    
    if existing:
        existing.config = payload.config
        existing.is_active = payload.is_active
    else:
        existing = Integration(
            user_id=current_user.id,
            provider=payload.provider,
            config=payload.config,
            is_active=payload.is_active
        )
        db.add(existing)
        
    db.commit()
    db.refresh(existing)
    return existing
