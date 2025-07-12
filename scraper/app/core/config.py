import logging

from pydantic_settings import BaseSettings  # type: ignore

logger = logging.getLogger("uvicorn")


class Settings(BaseSettings):

    # MongoDB settings
    MONGODB_URL: str
    MONGODB_DB_NAME: str
    CHROMEDRIVER_PATH: str
    ALLOWED_SOURCE_TYPES: list[str] = ["google", "csv"]
    ALLOWED_JOB_STATUSES: list[str] = ["pending", "running", "completed", "failed"]

    class Config:
        env_file = ".env"


# Create settings instance
settings = Settings()
