from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String)
    is_active = Column(Boolean, default=True)
    
    users = relationship("User", back_populates="vendor")
    clients = relationship("Client", back_populates="vendor")
