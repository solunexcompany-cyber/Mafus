from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from app.api import deps
from app.models.user import User, UserRole
from app.models.vendor import Vendor, ServiceStatus
from app.models.client import Client
from app.models.asset import Asset, AssetStatus, FinancingContract, ContractStatus
from app.models.payment import Payment
from app.core.security import get_password_hash
from pydantic import BaseModel, EmailStr
from typing import List, Optional

router = APIRouter()

# --- SCHEMAS ---
class ManagerCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    vendor_id: str

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str
    role: UserRole
    vendor_id: Optional[str] = None

class VendorUpdate(BaseModel):
    business_name: Optional[str] = None
    cac_number: Optional[str] = None
    business_address: Optional[str] = None
    contact_phone: Optional[str] = None
    business_type: Optional[str] = None

# --- HELPER: Generate Vendor Tag ---
def generate_vendor_tag(db: Session):
    tags = db.query(Vendor.vendor_tag).all()
    nums = []
    for (t,) in tags:
        if t and t.startswith("VEN-"):
            try:
                nums.append(int(t.split("-")[1]))
            except (ValueError, IndexError):
                pass
    max_num = max(nums) if nums else 0
    return f"VEN-{(max_num + 1):03d}"

# --- ENDPOINTS ---

@router.post("/vendor", response_model=dict)
def create_vendor_and_owner(
    *,
    db: Session = Depends(deps.get_db),
    name: str = Body(...),
    owner_email: str = Body(...),
    owner_password: str = Body(...),
    owner_full_name: str = Body(...),
    cac_number: Optional[str] = Body(None),
    business_address: Optional[str] = Body(None),
    contact_phone: Optional[str] = Body(None),
    business_type: Optional[str] = Body(None)
):
    if db.query(Vendor).filter(Vendor.business_name == name).first():
        raise HTTPException(status_code=400, detail="Vendor name already exists")
    
    vendor = Vendor(
        business_name=name,
        vendor_tag=generate_vendor_tag(db),
        cac_number=cac_number,
        business_address=business_address,
        contact_phone=contact_phone,
        business_type=business_type,
        status=ServiceStatus.ACTIVE
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    
    user = User(
        email=owner_email,
        username=owner_email,
        full_name=owner_full_name,
        hashed_password=get_password_hash(owner_password),
        role=UserRole.VENDOR_OWNER,
        vendor_id=vendor.id,
        is_active=True
    )
    db.add(user)
    db.commit()
    return {"message": "Vendor created", "vendor_id": vendor.id, "vendor_tag": vendor.vendor_tag}

@router.get("/vendor", response_model=List[dict])
def list_vendors(db: Session = Depends(deps.get_db)):
    vendors = db.query(Vendor).all()
    result = []
    for v in vendors:
        owner = db.query(User).filter(User.vendor_id == v.id, User.role == UserRole.VENDOR_OWNER).first()
        result.append({
            "id": v.id,
            "vendor_tag": v.vendor_tag,
            "name": v.business_name,
            "cac_number": v.cac_number or "N/A",
            "phone": v.contact_phone or "N/A",
            "status": v.status,
            "reason": v.suspension_reason,
            "owner_email": owner.email if owner else "N/A",
            "owner_full_name": owner.full_name if owner else "N/A"
        })
    return result

@router.get("/vendor/{vendor_id}/details")
def get_vendor_details(
    vendor_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    # Get all linked entities
    managers = db.query(User).filter(User.vendor_id == vendor_id, User.role == UserRole.MASTER_ADMIN).all()
    clients = db.query(Client).filter(Client.vendor_id == vendor_id).all()
    assets = db.query(Asset).filter(Asset.vendor_id == vendor_id).all()
    
    return {
        "vendor": {
            "id": vendor.id,
            "name": vendor.business_name,
            "status": vendor.status,
            "tag": vendor.vendor_tag
        },
        "managers": [{"id": m.id, "name": m.full_name, "email": m.email} for m in managers],
        "clients": [{"id": c.id, "name": c.full_name, "nin": c.national_id} for c in clients],
        "assets": [{"id": a.id, "internal_id": a.internal_id, "plate": a.plate_number, "status": a.status} for a in assets]
    }

@router.post("/vendor/{vendor_id}/status")
def update_vendor_status(
    vendor_id: str,
    status: str,
    reason: str = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    vendor.status = status
    if reason:
        vendor.suspension_reason = reason
    db.commit()
    return {"message": "Status updated"}

@router.post("/master-admin/{manager_id}/status")
def update_manager_status(
    manager_id: str,
    status: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.VENDOR_OWNER]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    manager = db.query(User).filter(User.id == manager_id, User.role == UserRole.MASTER_ADMIN).first()
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")
        
    manager.is_active = (status == 'active')
    db.commit()
    return {"message": f"Manager status updated to {status}"}

@router.delete("/master-admin/{manager_id}")
def delete_manager(
    manager_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.VENDOR_OWNER]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    manager = db.query(User).filter(User.id == manager_id).first()
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")
    db.delete(manager)
    db.commit()
    return {"message": "Manager deleted"}

@router.patch("/master-admin/{manager_id}")
def edit_manager(
    manager_id: str,
    full_name: Optional[str] = Body(None),
    email: Optional[str] = Body(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.VENDOR_OWNER]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    manager = db.query(User).filter(User.id == manager_id).first()
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")
    if full_name: manager.full_name = full_name
    if email: manager.email = email
    db.commit()
    return {"message": "Manager updated"}

@router.post("/master-admin", response_model=dict)
def create_manager(
    *,
    db: Session = Depends(deps.get_db),
    manager_in: ManagerCreate
):
    if db.query(User).filter(User.email == manager_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user = User(
        email=manager_in.email,
        username=manager_in.email,
        full_name=manager_in.full_name,
        hashed_password=get_password_hash(manager_in.password),
        role=UserRole.MASTER_ADMIN,
        vendor_id=manager_in.vendor_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    return {"message": "Manager created"}

@router.get("/master-admin", response_model=List[dict])
def list_managers(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    query = db.query(User).filter(User.role == UserRole.MASTER_ADMIN)
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(User.vendor_id == current_user.vendor_id)
    
    users = query.all()
    return [{"id": u.id, "email": u.email, "full_name": u.full_name, "vendor_id": u.vendor_id} for u in users]

@router.get("/me", response_model=dict)
def get_current_user_profile(current_user: User = Depends(deps.get_current_active_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "vendor_id": current_user.vendor_id
    }

@router.get("/dashboard/stats", response_model=dict)
def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role == UserRole.CLIENT:
        # Find the client details
        client = db.query(Client).filter(Client.id == current_user.client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Driver record not found")
        
        # Find the active contract
        contract = db.query(FinancingContract).filter(
            FinancingContract.client_id == client.id,
            FinancingContract.status == ContractStatus.ACTIVE
        ).first()
        
        contract_data = None
        asset_data = None
        payments_data = []
        
        if contract:
            total_paid = contract.total_value - contract.remaining_balance
            ownership_pct = (total_paid / contract.total_value * 100) if contract.total_value else 0
            
            contract_data = {
                "id": contract.id,
                "total_value": contract.total_value,
                "weekly_installment": contract.weekly_installment,
                "remaining_balance": contract.remaining_balance,
                "total_paid": total_paid,
                "ownership_percentage": round(ownership_pct, 1),
                "status": contract.status,
                "payment_account_number": contract.payment_account_number,
                "payment_bank_name": contract.payment_bank_name,
                "payment_account_name": contract.payment_account_name
            }
            
            # Find the linked asset details
            asset = contract.asset
            if asset:
                asset_data = {
                    "id": asset.id,
                    "internal_id": asset.internal_id,
                    "type": asset.model,
                    "model": asset.model,
                    "plate_number": asset.plate_number,
                    "chassis_number": asset.chassis_number,
                    "engine_number": asset.engine_number,
                    "karota_number": asset.karota_number
                }
            
            # Find the payments made
            payments = db.query(Payment).filter(Payment.contract_id == contract.id).order_by(Payment.timestamp.desc()).all()
            for p in payments:
                collector = db.query(User).filter(User.id == p.collected_by_id).first()
                payments_data.append({
                    "id": p.id,
                    "amount": p.amount,
                    "payment_method": p.payment_method,
                    "status": p.status,
                    "sender_name": p.sender_name,
                    "receipt_url": p.receipt_url,
                    "rejection_reason": p.rejection_reason,
                    "timestamp": p.timestamp.isoformat() if p.timestamp else None,
                    "collected_by": collector.full_name if collector else "System Agent"
                })
                
        return {
            "driver_profile": {
                "id": client.id,
                "full_name": client.full_name,
                "nickname": client.nickname,
                "dob": client.dob,
                "photo_url": client.photo_url,
                "national_id": client.national_id,
                "phone_number": client.phone_number,
                "address": client.address,
                "city_of_duty": client.city_of_duty,
                "next_of_kin": client.next_of_kin,
                "guarantor_info": client.guarantor_info
            },
            "contract": contract_data,
            "asset": asset_data,
            "payments": payments_data
        }

    vendor_query = db.query(Vendor)
    client_query = db.query(Client)
    asset_query = db.query(Asset)
    contract_query = db.query(FinancingContract)
    
    if current_user.role != UserRole.SUPER_ADMIN:
        vendor_id = current_user.vendor_id
        client_query = client_query.filter(Client.vendor_id == vendor_id)
        asset_query = asset_query.filter(Asset.vendor_id == vendor_id)
        contract_query = contract_query.join(Asset).filter(Asset.vendor_id == vendor_id)
        
    total_receivable = db.query(sql_func.sum(FinancingContract.remaining_balance)).select_from(contract_query.subquery()).scalar() or 0
    
    # Financial Privacy for Super Admin (Dev Profile)
    if current_user.role == UserRole.SUPER_ADMIN:
        total_receivable = 0

    return {
        "total_vendors": vendor_query.count(),
        "total_clients": client_query.count(),
        "total_assets": asset_query.count(),
        "stock_assets": asset_query.filter(Asset.status == AssetStatus.STOCK).count(),
        "managed_assets": asset_query.filter(Asset.status == AssetStatus.MANAGED).count(),
        "assigned_assets": asset_query.filter(Asset.status == AssetStatus.ASSIGNED).count(),
        "total_receivable": total_receivable
    }
