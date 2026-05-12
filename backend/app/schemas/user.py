from pydantic import BaseModel
from typing import Optional

class VendorCreateRequest(BaseModel):
    vendor_name: str
    vendor_address: Optional[str] = None
    owner_email: str
    owner_password: str
    owner_full_name: str

class MasterAdminCreateRequest(BaseModel):
    email: str
    password: str
    full_name: str
    vendor_id: Optional[int] = None

class ClientCreateRequest(BaseModel):
    full_name: str
    phone_number: str
    national_id: Optional[str] = None
    address: Optional[str] = None
    password: str
    vendor_id: Optional[int] = None
