"""consolidated_initial_schema

Revision ID: 8df189f51f52
Revises: 
Create Date: 2026-05-23 00:25:06.391995

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8df189f51f52'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # 1. Create Base Independent Tables First
    op.create_table('service_plans',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=True),
    sa.Column('max_assets', sa.Integer(), nullable=True),
    sa.Column('price', sa.Integer(), nullable=True),
    sa.Column('features', sa.JSON(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_service_plans_name'), 'service_plans', ['name'], unique=True)

    op.create_table('vendors',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('vendor_tag', sa.String(), nullable=True),
    sa.Column('business_name', sa.String(), nullable=True),
    sa.Column('cac_number', sa.String(), nullable=True),
    sa.Column('business_address', sa.String(), nullable=True),
    sa.Column('contact_phone', sa.String(), nullable=True),
    sa.Column('business_type', sa.String(), nullable=True),
    sa.Column('status', sa.Enum('PENDING', 'ACTIVE', 'SUSPENDED', name='servicestatus'), nullable=True),
    sa.Column('suspension_reason', sa.String(), nullable=True),
    sa.Column('plan_id', sa.String(), nullable=True),
    sa.Column('is_verified', sa.Boolean(), nullable=True),
    sa.Column('activation_date', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['plan_id'], ['service_plans.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vendors_business_name'), 'vendors', ['business_name'], unique=False)
    op.create_index(op.f('ix_vendors_vendor_tag'), 'vendors', ['vendor_tag'], unique=True)

    # 2. Create Clients (Temporarily remove the circular foreign key to users)
    op.create_table('clients',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('vendor_id', sa.String(), nullable=True),
    sa.Column('manager_id', sa.String(), nullable=True),
    sa.Column('full_name', sa.String(), nullable=True),
    sa.Column('nickname', sa.String(), nullable=True),
    sa.Column('dob', sa.String(), nullable=True),
    sa.Column('photo_url', sa.String(), nullable=True),
    sa.Column('national_id', sa.String(), nullable=True),
    sa.Column('phone_number', sa.String(), nullable=True),
    sa.Column('address', sa.String(), nullable=True),
    sa.Column('city_of_duty', sa.String(), nullable=True),
    sa.Column('next_of_kin', sa.JSON(), nullable=True),
    sa.Column('guarantor_info', sa.JSON(), nullable=True),
    sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_clients_full_name'), 'clients', ['full_name'], unique=False)

    # 3. Create Users (Safely points to clients and vendors since both exist now)
    op.create_table('users',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('username', sa.String(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('full_name', sa.String(), nullable=True),
    sa.Column('hashed_password', sa.String(), nullable=False),
    sa.Column('phone_number', sa.String(), nullable=True),
    sa.Column('role', sa.Enum('SUPER_ADMIN', 'VENDOR_OWNER', 'MASTER_ADMIN', 'COLLECTION_OFFICER', 'CLIENT', name='userrole'), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('vendor_id', sa.String(), nullable=True),
    sa.Column('client_id', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ),
    sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # 4. Hook up the circular link back onto clients now that users exists
    op.create_foreign_key('fk_clients_manager_id_users', 'clients', 'users', ['manager_id'], ['id'])

    # 5. Create Remaining Dependent Tables Safely
    op.create_table('assets',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('vendor_id', sa.String(), nullable=True),
    sa.Column('manager_id', sa.String(), nullable=True),
    sa.Column('internal_id', sa.String(), nullable=True),
    sa.Column('engine_number', sa.String(), nullable=True),
    sa.Column('plate_number', sa.String(), nullable=True),
    sa.Column('karota_number', sa.String(), nullable=True),
    sa.Column('model', sa.String(), nullable=True),
    sa.Column('status', sa.Enum('STOCK', 'MANAGED', 'ASSIGNED', 'AVAILABLE', 'REPO', 'COMPLETED', name='assetstatus'), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['manager_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('engine_number'),
    sa.UniqueConstraint('karota_number'),
    sa.UniqueConstraint('plate_number')
    )
    op.create_index(op.f('ix_assets_internal_id'), 'assets', ['internal_id'], unique=True)

    op.create_table('audit_logs',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('vendor_id', sa.String(), nullable=True),
    sa.Column('user_id', sa.String(), nullable=True),
    sa.Column('action', sa.String(), nullable=True),
    sa.Column('target_table', sa.String(), nullable=True),
    sa.Column('target_id', sa.String(), nullable=True),
    sa.Column('changes', sa.JSON(), nullable=True),
    sa.Column('ip_address', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('service_agreements',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('vendor_id', sa.String(), nullable=True),
    sa.Column('agreement_text', sa.String(), nullable=True),
    sa.Column('signed_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('financing_contracts',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('client_id', sa.String(), nullable=True),
    sa.Column('asset_id', sa.String(), nullable=True),
    sa.Column('total_value', sa.Float(), nullable=True),
    sa.Column('weekly_installment', sa.Float(), nullable=True),
    sa.Column('remaining_balance', sa.Float(), nullable=True),
    sa.Column('status', sa.Enum('ACTIVE', 'COMPLETED', 'VOID', 'REPOSSESSED', name='contractstatus'), nullable=True),
    sa.Column('payment_account_number', sa.String(), nullable=True),
    sa.Column('payment_bank_name', sa.String(), nullable=True),
    sa.Column('payment_account_name', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ),
    sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('payments',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('contract_id', sa.String(), nullable=False),
    sa.Column('amount', sa.Float(), nullable=False),
    sa.Column('payment_method', sa.Enum('CASH', 'BANK_TRANSFER', 'POS', name='paymentmethod'), nullable=True),
    sa.Column('status', sa.Enum('PENDING', 'APPROVED', 'REJECTED', name='paymentstatus'), nullable=True),
    sa.Column('timestamp', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.Column('sender_name', sa.String(), nullable=True),
    sa.Column('receipt_url', sa.String(), nullable=True),
    sa.Column('rejection_reason', sa.String(), nullable=True),
    sa.Column('collected_by_id', sa.String(), nullable=True),
    sa.Column('vendor_id', sa.String(), nullable=False),
    sa.ForeignKeyConstraint(['collected_by_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['contract_id'], ['financing_contracts.id'], ),
    sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_clients_manager_id_users', 'clients', type_='foreignkey')
    op.drop_table('payments')
    op.drop_table('financing_contracts')
    op.drop_table('service_agreements')
    op.drop_table('audit_logs')
    op.drop_index(op.f('ix_assets_internal_id'), table_name='assets')
    op.drop_table('assets')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_index(op.f('ix_clients_full_name'), table_name='clients')
    op.drop_table('clients')
    op.drop_index(op.f('ix_vendors_vendor_tag'), table_name='vendors')
    op.drop_index(op.f('ix_vendors_business_name'), table_name='vendors')
    op.drop_table('vendors')
    op.drop_index(op.f('ix_service_plans_name'), table_name='service_plans')
    op.drop_table('service_plans')