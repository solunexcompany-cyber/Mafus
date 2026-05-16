from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AssetBase(BaseModel):
    model: Optional[str] = None
    chassis_number: Optional[str] = None
    engine_number: Optional[str] = None
    plate_number: Optional[str] = None

class AssetCreate(AssetBase):
    vendor_id: Optional[str] = None 

class AssetResponse(AssetBase):
    id: str
    vendor_id: str
    internal_id: str
    status: str

    class Config:
        from_attributes = True

class AssignmentBase(BaseModel):
    client_id: str
    asset_id: str
    total_value: float
    weekly_installment: float

class AssignmentCreate(AssignmentBase):
    # Technical details to be filled by Manager during assignment
    plate_number: str
    chassis_number: str
    engine_number: str
    karota_number: str
    address: Optional[str] = None

class AssignmentResponse(AssignmentBase):
    id: str
    remaining_balance: float
    status: str
    created_at: Optional[datetime] = None
    
    # Nested info for UI
    client_name: Optional[str] = None
    plate_number: Optional[str] = None

    class Config:
        from_attributes = True
