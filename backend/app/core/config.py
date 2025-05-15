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

    class Config:
        env_file = os.path.join(Parent_DIR, ".env")

# Create settings instance
settings = Settings()