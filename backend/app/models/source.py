import re
from datetime import datetime, timezone
from models.helpers import is_validate_google_maps_reviews_url
from core.config import settings
from models import PyObjectId
from pydantic import BaseModel, Field, field_validator, model_validator


class SourceBase(BaseModel):
    name: str
    type: str
    business_id: PyObjectId
    user_id: PyObjectId
    location_id: PyObjectId
    url: str | None = None

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {PyObjectId: str, datetime: lambda dt: dt.isoformat()},
    }

    @field_validator("name")
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError("Source name cannot be empty or whitespace")
        if not (2 <= len(v.strip()) <= 50):
            raise ValueError("Source name length must be between 2 and 50 characters")
        # Optional: regex to allow only certain characters
        if not re.match(r"^[\w\s\-\.]+$", v):
            raise ValueError("Source name contains invalid characters")
        return v.strip()

    @field_validator("type")
    def validate_type(cls, v):
        if v not in settings.ALLOWED_SOURCE_TYPES:
            raise ValueError("Invalid type value")
        return v
    
    @model_validator(mode="after")
    def validate_url_for_type(self):
        if self.type == "google":
            if not self.url:
                raise ValueError("URL must be provided for Google sources")
            
            is_valid = is_validate_google_maps_reviews_url(self.url)
            if not is_valid:
                raise ValueError("URL must be a valid Google Maps reviews link")
                        
        return self
    
class SourceCreate(SourceBase):
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SourceInDB(SourceBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime
    updated_at: datetime | None = None
    last_collection_time: datetime | None = None


class SourceUpdate(BaseModel):
    name: str | None = None


class SourceResponse(SourceBase):
    id: PyObjectId
    created_at: datetime
    updated_at: datetime | None = None
    last_collection_time: datetime | None = None
