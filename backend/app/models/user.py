from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base

class RoleEnum(str, enum.Enum):
    DEV_ADMIN = "DEV_ADMIN"
    VENDOR_OWNER = "VENDOR_OWNER"
    MASTER_ADMIN = "MASTER_ADMIN"
    CLIENT = "CLIENT"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.CLIENT, nullable=False)
    is_active = Column(Boolean, default=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)

    vendor = relationship("Vendor", back_populates="users")
    client = relationship("Client", back_populates="user", uselist=False)
