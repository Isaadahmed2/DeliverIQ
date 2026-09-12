import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    integrations = relationship("Integration", back_populates="user", cascade="all, delete-orphan")

class Integration(Base):
    __tablename__ = "integrations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    provider = Column(String, nullable=False) # 'whatsapp_evolution', 'google_sheets', 'hubspot'
    config = Column(JSON, default=dict) # instance_name, sheet_id, api_token
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="integrations")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    external_order_id = Column(String, index=True, nullable=False) # e.g. ORD-1042
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    shipping_address = Column(Text, nullable=False)
    city = Column(String, nullable=False)
    cod_amount = Column(Float, nullable=False)
    order_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # ML Risk Fields
    risk_score = Column(Float, default=0.0) # 0.0 to 100.0
    risk_tier = Column(String, default="PENDING") # SAFE | MEDIUM | HIGH
    rto_probability = Column(Float, default=0.0)
    risk_factors = Column(JSON, default=list)
    
    # Workflow Status
    status = Column(String, default="PENDING") # PENDING | APPROVED | IN_CONFIRMATION | CANCELLED | ESCALATED
    retry_count = Column(Integer, default=0)
    
    # Geo
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    nearby_landmarks = Column(JSON, default=list)
    
    user = relationship("User", back_populates="orders")
    agent_executions = relationship("AgentExecution", back_populates="order", cascade="all, delete-orphan")

class AgentExecution(Base):
    __tablename__ = "agent_executions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    agent_name = Column(String, nullable=False) # ML_SCORER | WHATSAPP_CONFIRM | GEO_LANDMARK | ESCALATION | CRM_SYNC
    attempt_number = Column(Integer, default=1)
    status = Column(String, default="EXECUTED") # EXECUTED | FAILED | WAITING_INPUT
    thought = Column(Text, nullable=True)
    action_taken = Column(String, nullable=True)
    observation = Column(JSON, default=dict)
    score_delta = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    order = relationship("Order", back_populates="agent_executions")
