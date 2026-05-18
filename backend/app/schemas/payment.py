from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.payment import PaymentMethod

class PaymentBase(BaseModel):
    contract_id: str
    amount: float
    payment_method: PaymentMethod = PaymentMethod.CASH

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: str
    timestamp: datetime
    collected_by_id: Optional[str]
    vendor_id: str
    status: str
    sender_name: Optional[str] = None
    receipt_url: Optional[str] = None
    rejection_reason: Optional[str] = None
    driver_name: Optional[str] = None
    manager_name: Optional[str] = None
    vendor_name: Optional[str] = None

    class Config:
        from_attributes = True
