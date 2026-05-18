import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
import enum

class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    BANK_TRANSFER = "BANK_TRANSFER"
    POS = "POS"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    contract_id = Column(String, ForeignKey("financing_contracts.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.CASH)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.APPROVED)
    timestamp = Column(DateTime, server_default=func.now())
    
    # Claim Details (Only for driver uploaded payments)
    sender_name = Column(String, nullable=True)
    receipt_url = Column(String, nullable=True)
    rejection_reason = Column(String, nullable=True)
    
    # Tracking
    collected_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    vendor_id = Column(String, ForeignKey("vendors.id"), nullable=False)
    
    # Relations
    contract = relationship("FinancingContract", back_populates="payments")