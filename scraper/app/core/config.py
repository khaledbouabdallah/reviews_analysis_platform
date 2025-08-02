import logging

from pydantic_settings import BaseSettings

logger = logging.getLogger("uvicorn")


class Settings(BaseSettings):
    # MongoDB settings
    MONGODB_URI: str
    MONGODB_URL_SYNC: str
    MONGODB_DB_NAME: str
    CHROMEDRIVER_PATH: str
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

    class Config:
        env_file = ".env"


# Create settings instance
settings = Settings()
