from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.models.user import User, UserRole
from app.models.payment import Payment
from app.models.asset import FinancingContract, Asset, ContractStatus
from app.schemas.payment import PaymentCreate, PaymentResponse

router = APIRouter()

@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(
    *,
    db: Session = Depends(deps.get_db),
    payment_in: PaymentCreate,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Record an installment payment.
    - Decrements contract remaining_balance.
    - If balance hits 0, marks contract as COMPLETED.
    """
    contract = db.query(FinancingContract).filter(FinancingContract.id == payment_in.contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check vendor ownership
    asset = db.query(Asset).filter(Asset.id == contract.asset_id).first()
    if current_user.role != UserRole.SUPER_ADMIN and asset.vendor_id != current_user.vendor_id:
        raise HTTPException(status_code=403, detail="Not authorized for this vendor's data")

    # Create Payment
    payment = Payment(
        **payment_in.dict(),
        vendor_id=asset.vendor_id,
        collected_by_id=current_user.id
    )
    
    # Update Balance
    contract.remaining_balance -= payment_in.amount
    if contract.remaining_balance <= 0:
        contract.remaining_balance = 0
        contract.status = ContractStatus.COMPLETED
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """List payments with vendor filtering."""
    query = db.query(Payment)
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(Payment.vendor_id == current_user.vendor_id)
    
    return query.all()
