import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api import deps
from app.models.user import User, UserRole
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.asset import FinancingContract, Asset, ContractStatus
from app.models.client import Client
from app.models.vendor import Vendor
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
        status=PaymentStatus.APPROVED,
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

@router.post("/claim", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def submit_claim(
    *,
    db: Session = Depends(deps.get_db),
    contract_id: str = Form(...),
    amount: float = Form(...),
    sender_name: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Submit a transfer receipt claim by a Driver.
    - Saves uploaded receipt screenshot.
    - Creates a PENDING payment record.
    - Does NOT decrement remaining balance until approved.
    """
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Only drivers can submit claims")

    contract = db.query(FinancingContract).filter(
        FinancingContract.id == contract_id,
        FinancingContract.client_id == current_user.client_id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Active contract not found")

    # Ensure upload directory exists
    if not os.path.exists("uploads"):
        os.makedirs("uploads")

    # Save receipt file
    file_ext = file.filename.split(".")[-1]
    file_name = f"receipt_{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join("uploads", file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    payment = Payment(
        contract_id=contract.id,
        amount=amount,
        payment_method=PaymentMethod.BANK_TRANSFER,
        status=PaymentStatus.PENDING,
        sender_name=sender_name,
        receipt_url=f"/uploads/{file_name}",
        vendor_id=current_user.vendor_id
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@router.get("/pending", response_model=List[PaymentResponse])
def get_pending_claims(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """List pending payments for Managers/Super Admins."""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.VENDOR_OWNER, UserRole.MASTER_ADMIN]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    query = db.query(Payment).filter(Payment.status == PaymentStatus.PENDING)
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(Payment.vendor_id == current_user.vendor_id)
        
    return query.all()

@router.post("/{payment_id}/approve", response_model=PaymentResponse)
def approve_payment_claim(
    payment_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Approve a pending payment claim.
    - Changes status to APPROVED.
    - Logs the verifying manager's ID.
    - Decrements remaining balance of the contract.
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.VENDOR_OWNER, UserRole.MASTER_ADMIN]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment claim not found")

    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(status_code=400, detail="Payment is not pending")

    if current_user.role != UserRole.SUPER_ADMIN and payment.vendor_id != current_user.vendor_id:
        raise HTTPException(status_code=403, detail="Unauthorized for this vendor")

    # Update payment details
    payment.status = PaymentStatus.APPROVED
    payment.collected_by_id = current_user.id

    # Decrement balance
    contract = payment.contract
    contract.remaining_balance -= payment.amount
    if contract.remaining_balance <= 0:
        contract.remaining_balance = 0
        contract.status = ContractStatus.COMPLETED

    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@router.post("/{payment_id}/reject", response_model=PaymentResponse)
def reject_payment_claim(
    payment_id: str,
    rejection_reason: str = Form(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Reject a pending payment claim.
    - Changes status to REJECTED.
    - Logs rejection reason.
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.VENDOR_OWNER, UserRole.MASTER_ADMIN]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment claim not found")

    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(status_code=400, detail="Payment is not pending")

    if current_user.role != UserRole.SUPER_ADMIN and payment.vendor_id != current_user.vendor_id:
        raise HTTPException(status_code=403, detail="Unauthorized for this vendor")

    payment.status = PaymentStatus.REJECTED
    payment.rejection_reason = rejection_reason

    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    List payments with role-based visibility:
    - SUPER_ADMIN: returns everything.
    - VENDOR_OWNER: returns payments for all drivers and managers in the vendor.
    - MASTER_ADMIN (Manager): returns payments only for drivers assigned to them.
    """
    query = db.query(
        Payment.id,
        Payment.contract_id,
        Payment.amount,
        Payment.payment_method,
        Payment.status,
        Payment.timestamp,
        Payment.collected_by_id,
        Payment.vendor_id,
        Payment.sender_name,
        Payment.receipt_url,
        Payment.rejection_reason,
        Client.full_name.label("driver_name"),
        User.full_name.label("manager_name"),
        Vendor.business_name.label("vendor_name")
    ).select_from(Payment)\
     .join(FinancingContract, Payment.contract_id == FinancingContract.id)\
     .join(Client, FinancingContract.client_id == Client.id)\
     .join(Asset, FinancingContract.asset_id == Asset.id)\
     .outerjoin(User, Asset.manager_id == User.id)\
     .join(Vendor, Asset.vendor_id == Vendor.id)

    if current_user.role == UserRole.MASTER_ADMIN:
        query = query.filter(Asset.manager_id == current_user.id)
    elif current_user.role == UserRole.VENDOR_OWNER:
        query = query.filter(Payment.vendor_id == current_user.vendor_id)
        
    results = query.all()
    payments_list = []
    for r in results:
        payments_list.append({
            "id": r.id,
            "contract_id": r.contract_id,
            "amount": r.amount,
            "payment_method": r.payment_method,
            "status": r.status,
            "timestamp": r.timestamp,
            "collected_by_id": r.collected_by_id,
            "vendor_id": r.vendor_id,
            "sender_name": r.sender_name,
            "receipt_url": r.receipt_url,
            "rejection_reason": r.rejection_reason,
            "driver_name": r.driver_name,
            "manager_name": r.manager_name or "Self-Reported Claim (No Manager)",
            "vendor_name": r.vendor_name
        })
        
    return payments_list

from fastapi.responses import FileResponse
from datetime import datetime
import json

@router.post("/archive", status_code=status.HTTP_201_CREATED)
def archive_payments_ledger(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Create a backup JSON archive of all payments (SUPER_ADMIN only).
    """
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Unauthorized. Only developers can archive ledger.")

    # Fetch all payments with lineage details
    query = db.query(
        Payment.id,
        Payment.contract_id,
        Payment.amount,
        Payment.payment_method,
        Payment.status,
        Payment.timestamp,
        Payment.collected_by_id,
        Payment.vendor_id,
        Payment.sender_name,
        Payment.receipt_url,
        Payment.rejection_reason,
        Client.full_name.label("driver_name"),
        User.full_name.label("manager_name"),
        Vendor.business_name.label("vendor_name")
    ).select_from(Payment)\
     .join(FinancingContract, Payment.contract_id == FinancingContract.id)\
     .join(Client, FinancingContract.client_id == Client.id)\
     .join(Asset, FinancingContract.asset_id == Asset.id)\
     .outerjoin(User, Asset.manager_id == User.id)\
     .join(Vendor, Asset.vendor_id == Vendor.id)

    results = query.all()
    payments_data = []
    for r in results:
        payments_data.append({
            "id": r.id,
            "contract_id": r.contract_id,
            "amount": r.amount,
            "payment_method": r.payment_method,
            "status": r.status,
            "timestamp": str(r.timestamp),
            "collected_by_id": r.collected_by_id,
            "vendor_id": r.vendor_id,
            "sender_name": r.sender_name,
            "receipt_url": r.receipt_url,
            "rejection_reason": r.rejection_reason,
            "driver_name": r.driver_name,
            "manager_name": r.manager_name or "Self-Reported Claim (No Manager)",
            "vendor_name": r.vendor_name
        })

    # Ensure archive directory exists
    if not os.path.exists("archives"):
        os.makedirs("archives")

    timestamp_str = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"ledger_archive_{timestamp_str}.json"
    file_path = os.path.join("archives", filename)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(payments_data, f, indent=4)

    return {"message": "Ledger archived successfully", "filename": filename, "record_count": len(payments_data)}

@router.get("/archives")
def list_ledger_archives(
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    List all JSON archives in the archives folder (SUPER_ADMIN only).
    """
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if not os.path.exists("archives"):
        return []

    archives_list = []
    for entry in os.scandir("archives"):
        if entry.is_file() and entry.name.endswith(".json"):
            info = entry.stat()
            archives_list.append({
                "filename": entry.name,
                "size_bytes": info.st_size,
                "created_at": str(datetime.fromtimestamp(info.st_mtime))
            })

    # Sort by mtime descending
    archives_list.sort(key=lambda x: x["created_at"], reverse=True)
    return archives_list

@router.get("/archives/{filename}")
def download_ledger_archive(
    filename: str,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Download a backup JSON archive (SUPER_ADMIN only).
    """
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Unauthorized")

    safe_filename = os.path.basename(filename)
    file_path = os.path.join("archives", safe_filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archive file not found")

    return FileResponse(file_path, media_type="application/json", filename=safe_filename)
