import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Enum
from app.db.base_class import Base
import enum

class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"

class VendorSubscription(Base):
    __tablename__ = "vendor_subscriptions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id = Column(String, ForeignKey("vendors.id"), unique=True)
    plan_id = Column(String, ForeignKey("service_plans.id"))
    
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    current_period_end = Column(DateTime)
    
    # For Stage 1: "Other services collection"
    extra_charges = Column(Float, default=0.0)