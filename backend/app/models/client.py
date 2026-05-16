import uuid
from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Client(Base):
    __tablename__ = "clients"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id = Column(String, ForeignKey("vendors.id"))
    manager_id = Column(String, ForeignKey("users.id"), nullable=True) # The manager who registered this driver
    
    # Profile Data
    full_name = Column(String, index=True)
    nickname = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    photo_url = Column(String) # Path to the DP photograph
    national_id = Column(String) # NIN/ID Number
    phone_number = Column(String)
    address = Column(String, nullable=True)
    city_of_duty = Column(String, nullable=True)
    
    # Relationships
    next_of_kin = Column(JSON, nullable=True) # {name, phone, relation}
    
    # Documentation
    guarantor_info = Column(JSON) # List/Dict of guarantor details
    
    vendor = relationship("Vendor", back_populates="clients")
    manager = relationship("User", foreign_keys=[manager_id])
    contracts = relationship("FinancingContract", back_populates="client")