import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Enum, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
import enum

class AssetStatus(str, enum.Enum):
    STOCK = "STOCK"
    MANAGED = "MANAGED"
    ASSIGNED = "ASSIGNED"
    AVAILABLE = "AVAILABLE"
    REPO = "REPOSSESSED"
    COMPLETED = "COMPLETED"

class ContractStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    VOID = "void"
    REPOSSESSED = "repossessed"

class Asset(Base):
    __tablename__ = "assets"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id = Column(String, ForeignKey("vendors.id"))
    manager_id = Column(String, ForeignKey("users.id"), nullable=True) # Assigned Master Admin
    
    # Custom Tracking ID: e.g., "AL-Napep-001"
    internal_id = Column(String, unique=True, index=True)
    
    # Technical IDs (Initially N/A)
    engine_number = Column(String, unique=True, nullable=True)
    plate_number = Column(String, unique=True, nullable=True)
    karota_number = Column(String, unique=True, nullable=True)
    
    model = Column(String, nullable=True)
    status = Column(Enum(AssetStatus), default=AssetStatus.STOCK)
    created_at = Column(DateTime, server_default=func.now())
    
    vendor = relationship("Vendor", back_populates="assets")
    manager = relationship("User", foreign_keys=[manager_id])
    contract = relationship("FinancingContract", back_populates="asset", uselist=False)

class FinancingContract(Base):
    __tablename__ = "financing_contracts"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey("clients.id"))
    asset_id = Column(String, ForeignKey("assets.id"))
    
    total_value = Column(Float) 
    weekly_installment = Column(Float) 
    remaining_balance = Column(Float)
    status = Column(Enum(ContractStatus), default=ContractStatus.ACTIVE)
    
    # Destination Bank Details for driver payments
    payment_account_number = Column(String, nullable=True)
    payment_bank_name = Column(String, nullable=True)
    payment_account_name = Column(String, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    
    client = relationship("Client", back_populates="contracts")
    asset = relationship("Asset", back_populates="contract")
    payments = relationship("Payment", back_populates="contract")