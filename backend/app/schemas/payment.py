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

    class Config:
        from_attributes = True
