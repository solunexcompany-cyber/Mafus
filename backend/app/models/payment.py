import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Enum, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
import enum

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    POS = "pos"

class Payment(Base):
    __tablename__ = "payments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id = Column(String, ForeignKey("vendors.id"), index=True)
    contract_id = Column(String, ForeignKey("financing_contracts.id"))
    collected_by = Column(String, ForeignKey("users.id")) # The Collection Officer
    
    amount = Column(Float, nullable=False)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.CASH)
    timestamp = Column(DateTime, server_default=func.now())
    
    # Relations
    vendor = relationship("Vendor")
    contract = relationship("FinancingContract", back_populates="payments")
    collector = relationship("User")

class ReconciliationSnapshot(Base):
    """The Reconciliation Board: Stores weekly performance stats for the Vendor."""
    __tablename__ = "reconciliation_snapshots"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id = Column(String, ForeignKey("vendors.id"))
    
    week_number = Column(Integer)
    year = Column(Integer)
    
    total_expected = Column(Float) # Sum of all weekly_installments
    total_actual = Column(Float)   # Sum of all payments this week
    variance = Column(Float)       # expected - actual
    
    created_at = Column(DateTime, server_default=func.now())