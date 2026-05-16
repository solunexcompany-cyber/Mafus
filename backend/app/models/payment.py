import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
import enum

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    TRANSFER = "transfer"
    POS = "pos"

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    contract_id = Column(String, ForeignKey("financing_contracts.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.CASH)
    timestamp = Column(DateTime, server_default=func.now())
    
    # Tracking
    collected_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    vendor_id = Column(String, ForeignKey("vendors.id"), nullable=False)
    
    # Relations
    contract = relationship("FinancingContract", back_populates="payments")