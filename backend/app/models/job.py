import random
import re
from datetime import datetime, timezone

from core.config import settings
from models import PyObjectId
from pydantic import BaseModel, Field, field_validator, model_validator

# Name generation lists
ADJECTIVES = [
    "purple",
    "sleepy",
    "brave",
    "swift",
    "clever",
    "mighty",
    "gentle",
    "wild",
    "bright",
    "calm",
    "happy",
    "sneaky",
    "fierce",
    "playful",
    "shy",
    "curious",
    "bold",
    "loyal",
    "wise",
    "friendly",
    "charming",
    "graceful",
    "elegant",
]
ANIMALS = [
    "elephant",
    "dolphin",
    "penguin",
    "tiger",
    "eagle",
    "wolf",
    "fox",
    "bear",
    "owl",
    "deer",
    "rabbit",
    "lion",
    "panda",
    "giraffe",
    "koala",
    "zebra",
    "kangaroo",
    "raven",
    "raccoon",
]


class JobBase(BaseModel):
    name: str | None = Field(default=None, max_length=40, min_length=0)
    job_type: str = Field(...)  # "scraping" or "analysis"
    status: str = Field(default="pending")
    url: str | None = Field(default=None, max_length=500, min_length=5)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: datetime | None = None
    ended_at: datetime | None = None
    total_reviews: int | None = None
    reviews_handled: int | None = None
    error: str | None = None
    user_id: PyObjectId
    business_id: PyObjectId
    location_id: PyObjectId | None = None
    source_id: PyObjectId | None = None  # Optional field for upload jobs
    source_type: str | None = None

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {PyObjectId: str, datetime: lambda dt: dt.isoformat()},
    }

    @classmethod
    def generate_name(cls) -> str:
        """Generate a random name like 'purple_elephant_8472'"""
        adjective = random.choice(ADJECTIVES)
        animal = random.choice(ANIMALS)
        number = random.randint(1000, 9999)
        return f"{adjective}_{animal}_{number}"

    @field_validator("status")
    def validate_status(cls, value):
        if value not in settings.ALLOWED_JOB_STATUSES:
            raise ValueError(
                f"Invalid status value. Allowed: {settings.ALLOWED_JOB_STATUSES}",
            )
        return value

    @field_validator("job_type")
    def validate_job_type(cls, v):
        if v not in settings.ALLOWED_JOB_TYPES:
            raise ValueError(f"job_type must be one of {settings.ALLOWED_JOB_TYPES}")
        return v

    @model_validator(mode="after")
    def validate_job_fields(self):
        # Auto-generate name if not provided
        if not self.name:
            self.name = self.generate_name()

        # URL and source_type validation only for scraping jobs
        if self.job_type == "scraping":
            if not self.source_id:
                raise ValueError("source_id must be set for scraping jobs")

            if not self.source_type:
                raise ValueError("source_type must be set for scraping jobs")
            if self.source_type not in settings.ALLOWED_SOURCE_TYPES:
                raise ValueError(
                    f"Invalid source_type. Allowed: {settings.ALLOWED_SOURCE_TYPES}",
                )
            if not self.url:
                raise ValueError("url must be provided for scraping jobs")

            if self.source_type == "google":
                self.validate_google_maps_url(self.url)
            else:
                raise ValueError(f"Unsupported source_type: {self.source_type}")
        elif self.job_type == "csv_upload":
            pass  # No URL validation for CSV uploads

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
        raise ValueError


class JobCreate(JobBase):
    """Used for creating a new job."""


class JobInDB(JobBase):
    """Used internally and for DB storage."""

    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")


class JobUpdate(BaseModel):
    """Used for updating an existing job."""

    name: str | None = None
    status: str | None = None


class JobUpdateInternal(BaseModel):
    """Used for internal updates to a job."""

    title: str | None = None
    status: str | None = None
    url: str | None = None
    creation_time: datetime | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    total_reviews: int | None = None
    reviews_handled: int | None = None
    error: str | None = None


class JobResponse(JobBase):
    """Used for returning job data in API responses."""

    id: PyObjectId
