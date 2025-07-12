import os
import re
from datetime import datetime, timezone

from core.config import settings
from models import PyObjectId
from pydantic import BaseModel, Field, field_validator, model_validator


class JobBase(BaseModel):
    name: str | None = Field(default=None, max_length=100, min_length=2)
    status: str = Field(default="pending")
    url: str = Field(..., max_length=500, min_length=5)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: datetime | None = None
    ended_at: datetime | None = None
    total_reviews: int | None = None
    reviews_scraped: int | None = None
    error: str | None = None
    user_id: PyObjectId
    business_id: PyObjectId
    location_id: PyObjectId | None = None
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


class JobInDB(JobBase):
    """Used internally and for DB storage."""

    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")


class JobUpdate(BaseModel):
    """Used for updating an existing job."""

    title: str | None = None
    status: str | None = None


class JobUpdateInternal(JobBase):
    """Used for internal updates to a job."""

    title: str | None = None
    status: str | None = None
    url: str | None = None
    creation_time: datetime | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    total_reviews: int | None = None
    reviews_scraped: int | None = None
    error: str | None = None


class JobResponse(JobBase):
    """Used for returning job data in API responses."""

    id: PyObjectId
