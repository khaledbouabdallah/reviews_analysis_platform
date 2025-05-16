from pydantic_settings import BaseSettings # type: ignore
import logging


logger = logging.getLogger("uvicorn")

class Settings(BaseSettings):
    
    # MongoDB settings
    MONGODB_URL: str 
    MONGODB_DB_NAME: str
    CHROMEDRIVER_PATH: str
    
    class Config:
        env_file = ".env"

# Create settings instance
settings = Settings()