import os
from pathlib import Path
from pydantic_settings import BaseSettings
import logging


logger = logging.getLogger("uvicorn")
APP_DIR = os.getcwd()
Parent_DIR = Path(APP_DIR).parent


class Settings(BaseSettings):

    MONGODB_URL: str
    MONGODB_DB_NAME: str
    ALLOWED_SOURCE_TYPES: list[str] = ["google", "csv"]
    ALLOWED_JOB_STATUSES: list[str] = ["pending", "running", "completed", "failed"]
    SCRAPER_SERVICE_URL: str = os.getenv("SCRAPER_SERVICE_URL", "http://scraper:8001")

    # JWT Authentication settings
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", "your-secret-key-here-change-in-production"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = os.path.join(Parent_DIR, ".env")


# Create settings instance
settings = Settings()
