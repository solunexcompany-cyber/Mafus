from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, RoleEnum
from app.models.vendor import Vendor
from app.models.client import Client
from app.schemas.user import VendorCreateRequest, MasterAdminCreateRequest, ClientCreateRequest
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/vendor", status_code=status.HTTP_201_CREATED)
def create_vendor(
    *,
    db: Session = Depends(deps.get_db),
    vendor_in: VendorCreateRequest,
    current_user: User = Depends(deps.get_current_dev_admin)
):
    """Create new vendor (Level 2). Only DEV_ADMIN can do this."""
    if db.query(User).filter(User.email == vendor_in.owner_email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    vendor = Vendor(name=vendor_in.vendor_name, address=vendor_in.vendor_address)
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    
    user = User(
        email=vendor_in.owner_email,
        hashed_password=get_password_hash(vendor_in.owner_password),
        full_name=vendor_in.owner_full_name,
        role=RoleEnum.VENDOR_OWNER,
        vendor_id=vendor.id
    )
    db.add(user)
    db.commit()
    return {"message": "Vendor created successfully", "vendor_id": vendor.id}

@router.post("/master-admin", status_code=status.HTTP_201_CREATED)
def create_master_admin(
    *,
    db: Session = Depends(deps.get_db),
    admin_in: MasterAdminCreateRequest,
    current_user: User = Depends(deps.get_current_vendor_level)
):
    """Create Master Admin (Level 3). DEV_ADMIN or VENDOR_OWNER can do this."""
    if db.query(User).filter(User.email == admin_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    target_vendor_id = admin_in.vendor_id
    if current_user.role == RoleEnum.VENDOR_OWNER:
        target_vendor_id = current_user.vendor_id # Force to their own vendor
    
    if not target_vendor_id:
        raise HTTPException(status_code=400, detail="Vendor ID is required when created by Dev Admin")
        
    user = User(
        email=admin_in.email,
        hashed_password=get_password_hash(admin_in.password),
        full_name=admin_in.full_name,
        role=RoleEnum.MASTER_ADMIN,
        vendor_id=target_vendor_id
    )
    db.add(user)
    db.commit()
    return {"message": "Master Admin created successfully"}

@router.post("/client", status_code=status.HTTP_201_CREATED)
def create_client(
    *,
    db: Session = Depends(deps.get_db),
    client_in: ClientCreateRequest,
    current_user: User = Depends(deps.get_current_master_level)
):
    """Create Client (Level 4). DEV_ADMIN, VENDOR_OWNER, or MASTER_ADMIN can do this."""
    if db.query(User).filter(User.email == client_in.phone_number).first():
        raise HTTPException(status_code=400, detail="Phone number already registered as login")
        
    target_vendor_id = client_in.vendor_id
    if current_user.role in [RoleEnum.VENDOR_OWNER, RoleEnum.MASTER_ADMIN]:
        target_vendor_id = current_user.vendor_id
        
    if not target_vendor_id:
        raise HTTPException(status_code=400, detail="Vendor ID is required when created by Dev Admin")

    client = Client(
        full_name=client_in.full_name,
        phone_number=client_in.phone_number,
        national_id=client_in.national_id,
        address=client_in.address,
        vendor_id=target_vendor_id
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    
    # We use phone number as email for the user login to satisfy unique email constraint
    user = User(
        email=client_in.phone_number,
        hashed_password=get_password_hash(client_in.password),
        full_name=client_in.full_name,
        role=RoleEnum.CLIENT,
        vendor_id=target_vendor_id,
        client_id=client.id
    )
    db.add(user)
    db.commit()
    return {"message": "Client created successfully", "client_id": client.id}

@router.get("/vendor")
def get_vendors(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_dev_admin)
):
    vendors = db.query(Vendor).all()
    result = []
    for vendor in vendors:
        owner = db.query(User).filter(User.vendor_id == vendor.id, User.role == RoleEnum.VENDOR_OWNER).first()
        result.append({
            "id": vendor.id,
            "name": vendor.name,
            "address": vendor.address,
            "is_active": vendor.is_active,
            "owner_email": owner.email if owner else None,
            "owner_name": owner.full_name if owner else None
        })
    return result

@router.get("/master-admin")
def get_master_admins(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_vendor_level)
):
    query = db.query(User).filter(User.role == RoleEnum.MASTER_ADMIN)
    if current_user.role == RoleEnum.VENDOR_OWNER:
        query = query.filter(User.vendor_id == current_user.vendor_id)
        
    admins = query.all()
    return [{
        "id": a.id,
        "email": a.email,
        "full_name": a.full_name,
        "vendor_id": a.vendor_id,
        "is_active": a.is_active
    } for a in admins]

@router.get("/client")
def get_clients(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_master_level)
):
    query = db.query(Client)
    if current_user.role in [RoleEnum.VENDOR_OWNER, RoleEnum.MASTER_ADMIN]:
        query = query.filter(Client.vendor_id == current_user.vendor_id)
        
    clients = query.all()
    return [{
        "id": c.id,
        "full_name": c.full_name,
        "phone_number": c.phone_number,
        "national_id": c.national_id,
        "vendor_id": c.vendor_id,
        "is_active": c.is_active
    } for c in clients]

@router.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_master_level)
):
    vendor_query = db.query(Vendor)
    client_query = db.query(Client)
    
    if current_user.role in [RoleEnum.VENDOR_OWNER, RoleEnum.MASTER_ADMIN]:
        client_query = client_query.filter(Client.vendor_id == current_user.vendor_id)
    
    admin_query = db.query(User).filter(User.role == RoleEnum.MASTER_ADMIN)
    if current_user.role != RoleEnum.DEV_ADMIN:
        admin_query = admin_query.filter(User.vendor_id == current_user.vendor_id)

    return {
        "total_vendors": vendor_query.count() if current_user.role == RoleEnum.DEV_ADMIN else 1,
        "total_clients": client_query.count(),
        "total_admins": admin_query.count()
    }
