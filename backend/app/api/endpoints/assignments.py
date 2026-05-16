from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.models.user import User, UserRole
from app.models.asset import Asset, AssetStatus, FinancingContract, ContractStatus
from app.models.client import Client
from app.schemas.asset import AssignmentCreate, AssignmentResponse

router = APIRouter()

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_contract(
    *,
    db: Session = Depends(deps.get_db),
    contract_in: AssignmentCreate,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Final Deployment of an Asset to a Driver.
    - Performed by Manager (Master Admin).
    - Updates Asset with Plate/Chassis/Engine.
    - Changes Asset status to ASSIGNED.
    """
    if current_user.role not in [UserRole.MASTER_ADMIN, UserRole.SUPER_ADMIN, UserRole.VENDOR_OWNER]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    asset = db.query(Asset).filter(Asset.id == contract_in.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if asset.status not in [AssetStatus.MANAGED, AssetStatus.AVAILABLE, AssetStatus.STOCK]:
        raise HTTPException(status_code=400, detail=f"Asset cannot be assigned (Status: {asset.status})")

    # Verify Manager is assigned to this asset
    if current_user.role == UserRole.MASTER_ADMIN and asset.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="This asset is not in your managed pool")

    # Check for duplicate numbers
    if db.query(Asset).filter(Asset.plate_number == contract_in.plate_number).first():
        raise HTTPException(status_code=400, detail="Plate number already exists")

    # 1. Update Asset technical details
    asset.plate_number = contract_in.plate_number
    asset.chassis_number = contract_in.chassis_number
    asset.engine_number = contract_in.engine_number
    asset.karota_number = contract_in.karota_number
    asset.status = AssetStatus.ASSIGNED
    
    # 2. Create Financing Contract
    contract = FinancingContract(
        client_id=contract_in.client_id,
        asset_id=contract_in.asset_id,
        total_value=contract_in.total_value,
        weekly_installment=contract_in.weekly_installment,
        remaining_balance=contract_in.total_value,
        status=ContractStatus.ACTIVE
    )
    
    db.add(contract)
    db.commit()
    db.refresh(contract)
    
    return {"message": "Asset successfully deployed and contract active", "contract_id": contract.id}

@router.get("/", response_model=List[dict])
def get_contracts(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """List contracts with role-based filtering."""
    query = db.query(FinancingContract).join(Asset)
    
    if current_user.role == UserRole.VENDOR_OWNER:
        query = query.filter(Asset.vendor_id == current_user.vendor_id)
    elif current_user.role == UserRole.MASTER_ADMIN:
        query = query.filter(Asset.manager_id == current_user.id)
    elif current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    contracts = query.all()
    return [
        {
            "id": c.id,
            "driver_name": c.client.full_name if c.client else "N/A",
            "asset_id": c.asset.internal_id,
            "plate": c.asset.plate_number,
            "balance": c.remaining_balance,
            "weekly": c.weekly_installment,
            "status": c.status
        } for c in contracts
    ]
