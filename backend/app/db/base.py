from app.db.base_class import Base # Import from the new class file
from app.models.user import User, UserRole
from app.models.vendor import Vendor, ServicePlan, ServiceAgreement
from app.models.client import Client
from app.models.asset import Asset, AssetStatus, FinancingContract
from app.models.payment import Payment, PaymentMethod, ReconciliationSnapshot
from app.models.audit import AuditLog  