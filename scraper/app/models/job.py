from typing import List, Optional, Dict
from pydantic import BaseModel, Field, field_validator, model_validator
from pydantic import FieldValidationInfo
from datetime import datetime, timezone
from models import PyObjectId
import re
import os
from core.config import settings


class JobBase(BaseModel):
    name: Optional[str] = Field(default=None, max_length=100, min_length=2)
    status: str = Field(default="pending")
    url: str = Field(..., max_length=500, min_length=5)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    total_reviews: Optional[int] = None
    reviews_scraped: Optional[int] = None
    error: Optional[str] = None
    user_id: PyObjectId
    business_id: PyObjectId
    source_id: PyObjectId
    source_type: str

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {PyObjectId: str, datetime: lambda dt: dt.isoformat()},
    }

    @field_validator("status")
    def validate_status(cls, value):
        if value not in settings.ALLOWED_JOB_STATUSES:
            raise ValueError(
                f"Invalid status value. Allowed: {settings.ALLOWED_JOB_STATUSES}"
            )
        return value

    @field_validator("source_type")
    def validate_source_type(cls, v):
        if v not in settings.ALLOWED_SOURCE_TYPES:
            raise ValueError(
                f"Invalid source_type. Allowed: {settings.ALLOWED_SOURCE_TYPES}"
            )
        return v

    @model_validator(mode="after")
    def validate_url_by_source(self):
        if not self.source_type:
            raise ValueError("source_type must be set before url can be validated")

        if not self.url:
            raise ValueError("url must be provided")

        if self.source_type == "google":
            self.validate_google_maps_url(self.url)
        elif self.source_type == "csv":
            self._validate_csv_file(self.url)
        else:
            raise ValueError(f"Unsupported source_type: {self.source_type}")

        return self  # required by Pydantic

    @staticmethod
    def validate_google_maps_url(v):
        # Pattern to match Google Maps URLs

        google_maps_pattern = r"^https?://(www\.)?(google\.[a-z]{2,3}(/maps)?|maps\.google\.[a-z]{2,3})/.+$"

        if not re.match(google_maps_pattern, v):
            raise ValueError("URL must be a valid Google Maps link")
        # Method 1: Check for !4m18 or !4m8 parameter
        if re.search(r"!4m(18|8)\!", v):
            return v
        # Method 2: Check for !3m7 parameter
        if re.search(r"!3m7!", v):
            return v
        # Method 3: Count !9m1!1b1 occurrences
        if v.count("!9m1!1b1") >= 2:
            return v

    @staticmethod
    def _validate_csv_file(v):
        if not v.lower().endswith(".csv"):
            raise ValueError("URL must point to a CSV file")
        if not os.path.isfile(v):
            raise ValueError("CSV file does not exist")
        return v


class JobCreate(JobBase):
    """Used for creating a new job."""

    pass


class JobInDB(JobBase):
    """Used internally and for DB storage."""

    job_id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")


class JobUpdate(BaseModel):
    """Used for updating an existing job."""

    title: Optional[str] = None
    status: Optional[str] = None


class JobUpdateInternal(BaseModel):
    """Used for internal updates to a job."""

    title: Optional[str] = None
    status: Optional[str] = None
    url: Optional[str] = None
    creation_time: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    total_reviews: Optional[int] = None
    reviews_scraped: Optional[int] = None
    error: Optional[str] = None


class JobResponse(JobBase):
    """Used for returning job data in API responses."""

    job_id: PyObjectId = Field(alias="_id")
