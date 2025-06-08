from typing import List, Optional, Dict
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
from models import PyObjectId
import re
from core.config import logger

class BusinessBase(BaseModel):
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {
            PyObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
    }
    
    @field_validator("name")
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError("Source name cannot be empty or whitespace")
        if not (2 <= len(v.strip()) <= 100):
            raise ValueError("Source name length must be between 2 and 100 characters")
        # Optional: regex to allow only certain characters
        if not re.match(r'^[\w\s\-\.]+$', v):
            raise ValueError("Source name contains invalid characters")
        return v.strip()

class BusinessCreate(BusinessBase):
    try:
        logger.debug("Creating business")
        user_id: PyObjectId = Field(default_factory=PyObjectId)
    except ValueError as e:
        logger.error(f"Error creating business: {str(e)}")
        raise ValueError(f"{str(e)}")
    #user_id: PyObjectId

class BusinessInDB(BusinessBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    updated_at: Optional[datetime] = None    

class BusinessUpdate(BaseModel):
    name: Optional[str] = None

class BusinessResponse(BusinessBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    updated_at: Optional[datetime] = None

    
    
