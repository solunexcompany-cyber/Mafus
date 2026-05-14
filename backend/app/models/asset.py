import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum

class AssetStatus(str, enum.Enum):
    AVAILABLE = "available"
    ASSIGNED = "assigned"
    REPO = "repossessed"
    COMPLETED = "completed"

class Asset(Base):
    __tablename__ = "assets"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id = Column(String, ForeignKey("vendors.id"))
    
    # Technical IDs
    chassis_number = Column(String, unique=True, index=True)
    engine_number = Column(String, unique=True)
    plate_number = Column(String, unique=True)
    model = Column(String)
    
    status = Column(Enum(AssetStatus), default=AssetStatus.AVAILABLE)
    
    vendor = relationship("Vendor", back_populates="assets")
    contract = relationship("FinancingContract", back_populates="asset", uselist=False)

class FinancingContract(Base):
    __tablename__ = "financing_contracts"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey("clients.id"))
    asset_id = Column(String, ForeignKey("assets.id"))
    
    total_value = Column(Float) # The total price
    weekly_installment = Column(Float) # Amount to pay every week
    remaining_balance = Column(Float)
    
    client = relationship("Client", back_populates="contracts")
    asset = relationship("Asset", back_populates="contract")
    payments = relationship("Payment", back_populates="contract")