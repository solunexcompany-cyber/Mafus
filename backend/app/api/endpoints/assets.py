from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api import deps
from app.models.user import User, UserRole
from app.models.asset import Asset, AssetStatus, FinancingContract
from app.models.client import Client
from app.models.vendor import Vendor
from app.schemas.asset import AssetCreate, AssetResponse, AssignmentCreate
from sqlalchemy import or_
from pydantic import BaseModel

class ManagerAssignment(BaseModel):
    asset_ids: List[str]
    manager_id: str

router = APIRouter()

@router.get("/search", response_model=dict)
def global_search(
    q: str = Query(..., min_length=2),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Search is an Admin power tool")
    
    # Search logic
    asset = db.query(Asset).join(Vendor).outerjoin(User, Asset.manager_id == User.id).outerjoin(FinancingContract).outerjoin(Client).filter(
        or_(
            Asset.plate_number.ilike(f"%{q}%"),
            Asset.karota_number.ilike(f"%{q}%"),
            Asset.chassis_number.ilike(f"%{q}%"),
            Asset.internal_id.ilike(f"%{q}%"),
            Client.national_id.ilike(f"%{q}%"),
            Client.full_name.ilike(f"%{q}%"),
            Client.nickname.ilike(f"%{q}%"),
            Vendor.business_name.ilike(f"%{q}%")
        )
    ).first()

    if not asset:
        raise HTTPException(status_code=404, detail="No asset found matching that query")

    # Assemble "The Brain Data"
    contract = asset.contract
    client = contract.client if contract else None
    vendor = asset.vendor
    manager = asset.manager

    return {
        "asset": {
            "internal_id": asset.internal_id,
            "plate": asset.plate_number,
            "karota": asset.karota_number,
            "chassis": asset.chassis_number,
            "engine": asset.engine_number,
            "model": asset.model,
            "status": asset.status
        },
        "driver": {
            "name": client.full_name if client else "N/A",
            "nickname": client.nickname if client else "N/A",
            "nin": client.national_id if client else "N/A",
            "phone": client.phone_number if client else "N/A",
            "address": client.address if client else "N/A",
            "city": client.city_of_duty if client else "N/A",
            "photo": client.photo_url if client else None,
            "nok": client.next_of_kin if client else {},
            "guarantor": client.guarantor_info if client else {}
        } if client else None,
        "management": {
            "vendor_name": vendor.business_name,
            "vendor_tag": vendor.vendor_tag,
            "vendor_phone": vendor.contact_phone,
            "manager_name": manager.full_name if manager else "Not Assigned",
            "manager_phone": manager.phone_number if manager else "N/A"
        },
        "finance": {
            "total_value": contract.total_value,
            "weekly": contract.weekly_installment,
            "balance": contract.remaining_balance,
            "status": contract.status
        } if contract else None
    }

@router.get("/", response_model=List[dict])
def list_assets(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    query = db.query(Asset)
    if current_user.role == UserRole.VENDOR_OWNER:
        query = query.filter(Asset.vendor_id == current_user.vendor_id)
    elif current_user.role == UserRole.MASTER_ADMIN:
        query = query.filter(Asset.manager_id == current_user.id)
        
    assets = query.all()
    return [
        {
            "id": a.id,
            "internal_id": a.internal_id,
            "type": a.model,
            "plate": a.plate_number,
            "status": a.status
        } for a in assets
    ]

@router.post("/batch", status_code=status.HTTP_201_CREATED)
def batch_create_assets(
    company_prefix: str,
    asset_type: str,
    count: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role != UserRole.VENDOR_OWNER:
        raise HTTPException(status_code=403, detail="Only Vendors can bulk create stock")
    
    assets = []
    for i in range(1, count + 1):
        asset = Asset(
            vendor_id=current_user.vendor_id,
            internal_id=f"{company_prefix}-{asset_type}-{i:03d}",
            model=asset_type,
            status=AssetStatus.STOCK
        )
        db.add(asset)
        assets.append(asset)
    
    db.commit()
    return {"message": f"{count} assets generated"}

@router.post("/assign-manager")
def assign_to_manager(
    assignment: ManagerAssignment,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role != UserRole.VENDOR_OWNER:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.query(Asset).filter(Asset.id.in_(assignment.asset_ids)).update({
        "manager_id": assignment.manager_id,
        "status": AssetStatus.MANAGED
    }, synchronize_session=False)
    db.commit()
    return {"message": "Assets assigned to manager"}
