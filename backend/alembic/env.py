from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool, create_engine
from alembic import context
import os

# Import models
from app.db.base_class import Base 
from app.models.user import User, UserRole
from app.models.vendor import Vendor, ServicePlan, ServiceAgreement
from app.models.client import Client
from app.models.asset import Asset, AssetStatus, FinancingContract
from app.models.payment import Payment, PaymentMethod
from app.models.audit import AuditLog
from app.core.config import settings

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_online() -> None:
    # The database URI is now intelligently constructed in config.py
    # to handle both TCP and Unix socket connections.
    uri = settings.SQLALCHEMY_DATABASE_URI
    print(f"🚀 Migration Engine using: {uri}")
    
    connectable = create_engine(uri, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

run_migrations_online()
