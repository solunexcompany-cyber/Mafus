import uuid
from sqlalchemy import Column, String, ForeignKey, JSON, DateTime
from sqlalchemy.sql import func
from app.db.base_class import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id = Column(String, ForeignKey("vendors.id"), nullable=True) # Null for Dev Service logs
    user_id = Column(String, ForeignKey("users.id"))
    
    action = Column(String) # e.g., "PAYMENT_COLLECTED", "CONTRACT_MODIFIED"
    target_table = Column(String) # e.g., "financing_contracts"
    target_id = Column(String)
    
    # JSON payload to store 'before' and 'after' states
    changes = Column(JSON) 
    ip_address = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    
