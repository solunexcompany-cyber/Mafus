from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from app.api import deps
from app.models.user import User, UserRole
from app.models.client import Client
from pydantic import BaseModel
from app.core.security import get_password_hash
import shutil
import os
import uuid

router = APIRouter()

class ClientCreate(BaseModel):
    full_name: str
    nickname: Optional[str] = None
    dob: Optional[str] = None
    national_id: str
    phone_number: str
    address: str
    city_of_duty: str
    photo_url: Optional[str] = None
    next_of_kin: Dict[str, str] # {name, phone, relation}
    guarantor_info: Dict[str, str] # {name, phone, address}

@router.post("/", response_model=dict)
def create_client(
    *,
    db: Session = Depends(deps.get_db),
    client_in: ClientCreate,
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role not in [UserRole.MASTER_ADMIN, UserRole.VENDOR_OWNER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if db.query(Client).filter(Client.national_id == client_in.national_id).first():
        raise HTTPException(status_code=400, detail="Driver with this NIN already registered")
        
    if db.query(User).filter(User.username == client_in.phone_number).first():
        raise HTTPException(status_code=400, detail="Driver with this phone number already registered as a user")

    client = Client(
        **client_in.dict(),
        vendor_id=current_user.vendor_id,
        manager_id=current_user.id if current_user.role == UserRole.MASTER_ADMIN else None
    )
    db.add(client)
    db.commit()
    db.refresh(client)

    # Automatically provision a User login account for the driver
    user = User(
        email=f"{client_in.national_id}@mafos.com",
        username=client_in.phone_number,
        full_name=client_in.full_name,
        hashed_password=get_password_hash(client_in.phone_number),
        role=UserRole.CLIENT,
        vendor_id=client.vendor_id,
        client_id=client.id,
        is_active=True
    )
    db.add(user)
    db.commit()

    return {"message": "Driver registered successfully", "id": client.id}

@router.post("/upload-photo")
async def upload_driver_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Ensure it's an image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_ext = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join("uploads", file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"photo_url": f"/uploads/{file_name}"}

@router.get("/", response_model=List[dict])
def list_clients(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    query = db.query(Client)
    
    # Filtering logic:
    if current_user.role in [UserRole.MASTER_ADMIN, UserRole.VENDOR_OWNER]:
        # Managers and Vendors see all drivers in their company
        query = query.filter(Client.vendor_id == current_user.vendor_id)
    # Super admins see all
        
    clients = query.all()
    return [
        {
            "id": c.id,
            "full_name": c.full_name,
            "nickname": c.nickname,
            "phone": c.phone_number,
            "nin": c.national_id,
            "photo": c.photo_url,
            "city": c.city_of_duty
        } for c in clients
    ]

@router.delete("/{client_id}")
def delete_client(
    client_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.VENDOR_OWNER, UserRole.MASTER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    # Security: Managers can only delete THEIR drivers
    if current_user.role == UserRole.MASTER_ADMIN and client.manager_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized to delete this driver")

    db.delete(client)
    db.commit()
    return {"message": "Driver deleted"}

@router.patch("/{client_id}")
def edit_client(
    client_id: str,
    client_in: Dict = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.VENDOR_OWNER, UserRole.MASTER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Driver not found")

    if current_user.role == UserRole.MASTER_ADMIN and client.manager_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized to edit this driver")

    for key, value in client_in.items():
        if hasattr(client, key):
            setattr(client, key, value)
            
    db.commit()
    return {"message": "Driver profile updated"}
