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
    name = Column(String, unique=True, index=True) # e.g., "Free Tier", "Standard Fleet"
    max_assets = Column(Integer, default=10)
    price = Column(Integer, default=0) # Price in Kobo/Cents
    features = Column(JSON) # To store dynamic plan features

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_name = Column(String, index=True)
    status = Column(Enum(ServiceStatus), default=ServiceStatus.PENDING)
    plan_id = Column(String, ForeignKey("service_plans.id"))
    
    # Activation Service Data
    is_verified = Column(Boolean, default=False)
    activation_date = Column(DateTime, nullable=True)
    
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
    agreement_text = Column(String) # The signed terms
    signed_at = Column(DateTime, server_default=func.now())
    
    vendor = relationship("Vendor", back_populates="agreements")