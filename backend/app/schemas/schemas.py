from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- AUTH SCHEMAS ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: Optional[str] = None
    company_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- ORDER SCHEMAS ---
class OrderCreate(BaseModel):
    external_order_id: str
    customer_name: str
    customer_phone: str
    shipping_address: str
    city: str
    cod_amount: float
    order_timestamp: Optional[datetime] = None

class AgentExecutionSchema(BaseModel):
    id: str
    agent_name: str
    attempt_number: int
    status: str
    thought: Optional[str] = None
    action_taken: Optional[str] = None
    observation: Dict[str, Any] = {}
    score_delta: float = 0.0
    created_at: datetime
    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    external_order_id: str
    customer_name: str
    customer_phone: str
    shipping_address: str
    city: str
    cod_amount: float
    order_timestamp: datetime
    risk_score: float
    risk_tier: str
    rto_probability: float
    risk_factors: List[str]
    status: str
    retry_count: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    nearby_landmarks: List[Dict[str, Any]] = []
    agent_executions: List[AgentExecutionSchema] = []
    class Config:
        from_attributes = True

# --- AGENT RUN SCHEMAS ---
class BatchAgentRunRequest(BaseModel):
    hours: Optional[int] = Field(default=24, description="Lookback window: 6, 12, 18, or 24 hours")
    order_ids: Optional[List[str]] = Field(default=None, description="Optional list of specific order IDs to run agents on selectively")

class BatchAgentRunResponse(BaseModel):
    processed_count: int
    direct_approved: int
    in_confirmation: int
    high_risk_flagged: int
    orders_affected: List[str]

# --- INTEGRATIONS SCHEMAS ---
class IntegrationUpdate(BaseModel):
    provider: str
    config: Dict[str, Any]
    is_active: bool = True
