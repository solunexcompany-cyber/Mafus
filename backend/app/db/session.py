from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create the SQLAlchemy engine
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    # pool_pre_ping helps recover from lost connections, useful for 
    # the "low-connectivity environments" mentioned in your blueprint
    pool_pre_ping=True 
)

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)