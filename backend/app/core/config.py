import logging
import os
from pathlib import Path

from pydantic_settings import BaseSettings

logger = logging.getLogger("uvicorn")
APP_DIR = os.getcwd()
Parent_DIR = Path(APP_DIR).parent


class Settings(BaseSettings):
    MONGODB_URI: str
    MONGODB_DB_NAME: str = "main"
    GIMINI_API_KEY: str
    GIMINI_MODEL_NAME: str
    ALLOWED_SOURCE_TYPES: list[str] = ["google", "csv"]
    ALLOWED_JOB_STATUSES: list[str] = [
        "pending",
        "running",
        "completed",
        "failed",
        "partially_completed",
        "saving",
        "canceled",
    ]

    SCRAPER_SERVICE_URL: str = os.getenv("SCRAPER_SERVICE_URL", "http://scraper:8001")

    # JWT Authentication settings
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "your-secret-key-here-change-in-production",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 1 day

    class Config:
        env_file = os.path.join(Parent_DIR, ".env")


# Create settings instance
settings = Settings()
