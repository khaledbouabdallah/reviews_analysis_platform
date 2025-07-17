# backend/app/models/business.py (CLEAN VERSION)
import re
from datetime import datetime, timezone

from models import PyObjectId
from pydantic import BaseModel, Field, field_validator


class BusinessBase(BaseModel):
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    description: str | None = None
    segments: list[str] | None = None
    auto_update_segments: bool = True
    context: str | None = None

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {PyObjectId: str, datetime: lambda dt: dt.isoformat()},
    }

    @field_validator("name")
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError("Business name cannot be empty or whitespace")
        if not (2 <= len(v.strip()) <= 100):
            raise ValueError(
                "Business name length must be between 2 and 100 characters",
            )
        if not re.match(r"^[\w\s\-\.]+$", v):
            raise ValueError("Business name contains invalid characters")
        return v.strip()


class BusinessCreate(BusinessBase):
    user_id: PyObjectId


class BusinessInDB(BusinessBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    updated_at: datetime | None = None


class BusinessUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    segments: list[str] | None = None

    @field_validator("name")
    def validate_name(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError("Business name cannot be empty or whitespace")
            if not (2 <= len(v.strip()) <= 100):
                raise ValueError(
                    "Business name length must be between 2 and 100 characters",
                )
            if not re.match(r"^[\w\s\-\.]+$", v):
                raise ValueError("Business name contains invalid characters")
            return v.strip()
        return v


class BusinessResponse(BusinessBase):
    id: PyObjectId
    user_id: PyObjectId
    updated_at: datetime | None = None
