from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    full_name = Column(String, nullable=False)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    national_id = Column(String, unique=True, index=True)
    address = Column(String)
    is_active = Column(Boolean, default=True)

    vendor = relationship("Vendor", back_populates="clients")
    guarantor = relationship("Guarantor", back_populates="client", uselist=False)
    assignments = relationship("Assignment", back_populates="client")
    user = relationship("User", back_populates="client", uselist=False)

class Guarantor(Base):
    __tablename__ = "guarantors"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), unique=True)
    full_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    national_id = Column(String)
    address = Column(String)

    client = relationship("Client", back_populates="guarantor")
