from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base
import datetime

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    asset_type = Column(String, nullable=False) # e.g., Tricycle, Motorcycle, POS
    chassis_number = Column(String, unique=True, index=True)
    engine_number = Column(String, unique=True, index=True)
    plate_number = Column(String, unique=True, index=True)
    status = Column(String, default="AVAILABLE") # AVAILABLE, ASSIGNED, MAINTENANCE
    
    vendor = relationship("Vendor")
    assignments = relationship("Assignment", back_populates="asset")

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    asset_id = Column(Integer, ForeignKey("assets.id"))
    total_amount = Column(Float, nullable=False)
    weekly_installment = Column(Float, nullable=False)
    duration_weeks = Column(Integer, nullable=False)
    balance_remaining = Column(Float, nullable=False)
    status = Column(String, default="ACTIVE") # ACTIVE, COMPLETED, DEFAULTED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    client = relationship("Client", back_populates="assignments")
    asset = relationship("Asset", back_populates="assignments")
    payments = relationship("Payment", back_populates="assignment")
