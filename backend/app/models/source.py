from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime, timezone
from models import PyObjectId
import re
from core.config import settings


class SourceBase(BaseModel):
    name: str
    type: str
    business_id: PyObjectId
    user_id: PyObjectId

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {PyObjectId: str, datetime: lambda dt: dt.isoformat()},
    }

    @field_validator("name")
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError("Source name cannot be empty or whitespace")
        if not (2 <= len(v.strip()) <= 100):
            raise ValueError("Source name length must be between 2 and 100 characters")
        # Optional: regex to allow only certain characters
        if not re.match(r"^[\w\s\-\.]+$", v):
            raise ValueError("Source name contains invalid characters")
        return v.strip()

    @field_validator("type")
    def validate_type(cls, v):
        if v not in settings.ALLOWED_SOURCE_TYPES:
            raise ValueError("Invalid type value")
        return v


class SourceCreate(SourceBase):
    user_id: PyObjectId = Field(default_factory=PyObjectId)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SourceInDB(SourceBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_collection_time: Optional[datetime] = None


class SourceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None


class SourceResponse(SourceBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_collection_time: Optional[datetime] = None
