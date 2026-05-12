from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from app.db.base import Base
import datetime

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    amount = Column(Float, nullable=False)
    payment_date = Column(DateTime, default=datetime.datetime.utcnow)
    recorded_by_id = Column(Integer, ForeignKey("users.id"))
    receipt_number = Column(String, unique=True, index=True)

    assignment = relationship("Assignment", back_populates="payments")
    recorded_by = relationship("User")
