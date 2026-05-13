import uuid
from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base

class Client(Base):
    __tablename__ = "clients"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id = Column(String, ForeignKey("vendors.id"))
    
    # Profile Data
    full_name = Column(String, index=True)
    photo_url = Column(String) # Path to the DP photograph
    national_id = Column(String) # NIN/ID Number
    phone_number = Column(String)
    
    # Documentation
    guarantor_info = Column(JSON) # List/Dict of guarantor details
    
    vendor = relationship("Vendor", back_populates="clients")
    contracts = relationship("FinancingContract", back_populates="client")