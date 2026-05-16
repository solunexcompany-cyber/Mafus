import os
from urllib.parse import quote_plus
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# Absolute path to .env
env_path = Path(__file__).parent.parent.parent / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "MAFOS"
    API_V1_STR: str = "/api/v1"
    # WARNING: This is a development key. Use a securely generated key in production.
    SECRET_KEY: str = "super-secret-key-for-dev"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 
    
    # Database credentials loaded from .env file
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: str = "5432"

    model_config = SettingsConfigDict(
        env_file=str(env_path), 
        env_file_encoding='utf-8', 
        extra="ignore"
    )

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """
        Constructs the database URI from settings.
        Handles both TCP and Unix socket connections.
        """
        encoded_password = quote_plus(self.POSTGRES_PASSWORD or "")
        # If POSTGRES_SERVER starts with '/', assume it's a Unix socket path.
        if self.POSTGRES_SERVER.startswith('/'):
            return (
                f"postgresql://{self.POSTGRES_USER}:{encoded_password}@/"
                f"{self.POSTGRES_DB}?host={self.POSTGRES_SERVER}"
            )
        # Otherwise, assume it's a TCP connection (hostname or IP).
        return (f"postgresql://{self.POSTGRES_USER}:{encoded_password}@"
                f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}")

settings = Settings()