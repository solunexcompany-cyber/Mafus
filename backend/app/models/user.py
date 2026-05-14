import uuid
from sqlalchemy import Column, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin" # Developers/DevOps
    VENDOR_OWNER = "vendor_owner" # The Boss
    MASTER_ADMIN = "master_admin" # Fleet Manager
    COLLECTION_OFFICER = "collection_officer" # Field Agent

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.COLLECTION_OFFICER)
    
    # Node Linking: Every user belongs to a Vendor (except Super Admin)
    vendor_id = Column(String, ForeignKey("vendors.id"), nullable=True)
    
    vendor = relationship("Vendor", back_populates="users")