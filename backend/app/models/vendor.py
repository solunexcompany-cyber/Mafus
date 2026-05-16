import uuid
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, Enum, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
import enum

class ServiceStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"

class ServicePlan(Base):
    __tablename__ = "service_plans"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True) 
    max_assets = Column(Integer, default=10)
    price = Column(Integer, default=0) 
    features = Column(JSON) 

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_tag = Column(String, unique=True, index=True) # e.g., "VEN-001"
    
    # Business Information
    business_name = Column(String, index=True)
    cac_number = Column(String, nullable=True)
    business_address = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    business_type = Column(String, nullable=True) # e.g., "Logistics", "Retail"
    
    status = Column(Enum(ServiceStatus), default=ServiceStatus.PENDING)
    suspension_reason = Column(String, nullable=True)
    plan_id = Column(String, ForeignKey("service_plans.id"), nullable=True)
    
    # Activation Service Data
    is_verified = Column(Boolean, default=False)
    activation_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Tenancy Relations
    plan = relationship("ServicePlan")
    users = relationship("User", back_populates="vendor")
    clients = relationship("Client", back_populates="vendor")
    assets = relationship("Asset", back_populates="vendor")
    agreements = relationship("ServiceAgreement", back_populates="vendor")

class ServiceAgreement(Base):
    __tablename__ = "service_agreements"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id = Column(String, ForeignKey("vendors.id"))
    agreement_text = Column(String) 
    signed_at = Column(DateTime, server_default=func.now())
    
    vendor = relationship("Vendor", back_populates="agreements")