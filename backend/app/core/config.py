import logging
import os
from pathlib import Path

from pydantic_settings import BaseSettings, ValidationError

logger = logging.getLogger("uvicorn")
APP_DIR = os.getcwd()
Parent_DIR = Path(APP_DIR).parent


class Settings(BaseSettings):
    MONGODB_URI: str
    MONGODB_DB_NAME: str = "reviews_prod"
    GIMINI_API_KEY: str
    ENVIRONMENT: str
    FRONTEND_URL: str
    GIMINI_MODEL_NAME: str
    ALLOWED_SOURCE_TYPES: list[str] = ["google", "csv"]
    ALLOWED_SCRAPING_TYPES: list[str] = ["google"]
    ALLOWED_JOB_TYPES: list[str] = ["scraping", "analysis", "csv_upload"]
    ALLOWED_JOB_STATUSES: list[str] = [
        "pending",
        "running",
        "completed",
        "failed",
        "partially_completed",
        "saving",
        "canceled",
    ]
    SCRAPER_SERVICE_URL: str

    # JWT Authentication settings
    SECRET_KEY: str = "dev-secret-key"
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 1 day

    class Config:
        env_file = os.path.join(Parent_DIR, ".env")
        env_file_encoding = "utf-8"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # Validate environment
        if self.ENVIRONMENT not in ["development", "production"]:
            raise ValueError("ENVIRONMENT must be 'development' or 'production'")

        # Ensure SECRET_KEY is set in production
        if self.ENVIRONMENT == "production" and not self.SECRET_KEY:
            raise ValueError("SECRET_KEY must be set in production!")


# Create settings instance
try:
    settings = Settings()
except ValidationError as e:
    logger.error(f"Settings validation error: {e}")
    raise
