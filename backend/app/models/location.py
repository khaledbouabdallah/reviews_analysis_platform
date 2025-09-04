import re
from datetime import datetime, timezone

from models import PyObjectId
from pydantic import BaseModel, Field, field_validator


class LocationBase(BaseModel):
    name: str
    address: str
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
            raise ValueError("Location name cannot be empty or whitespace")
        if not (2 <= len(v.strip()) <= 100):
            raise ValueError("Location name length must be between 2 and 100 characters")
        # Optional: regex to allow only certain characters
        if not re.match(r"^[\w\s\-\.]+$", v):
            raise ValueError("Location name contains invalid characters")
        return v.strip()


class LocationCreate(LocationBase):
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LocationInDB(LocationBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime
    updated_at: datetime | None = None

class LocationUpdate(BaseModel):
    name: str | None = None
    address: str | None = None


class LocationResponse(LocationBase):
    id: PyObjectId
    created_at: datetime
    updated_at: datetime | None = None
