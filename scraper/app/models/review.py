from datetime import datetime

from core.config import settings
from models import PyObjectId
from pydantic import BaseModel, Field, field_validator, model_validator


def validate_google_review(data):
    required_fields = ["original_text", "translated_text", "date", "rating", "username"]
    missing = [f for f in required_fields if f not in data]
    if missing:
        raise ValueError(f"Google review is missing required fields: {missing}")
    return data


def validate_csv_review(data):
    if "text" not in data:
        raise ValueError("CSV review must contain at least 'text' field")
    return data


SOURCE_VALIDATORS = {
    "google": validate_google_review,
    "csv": validate_csv_review,
}


class ProcessedData(BaseModel):
    cleaned_text: str | None = None  # Cleaned version of review text
    translated_text: str | None = None  # Translated version if applicable
    detected_language: str | None = None  # Language code (en, fr, es, etc.)
    sentiment: dict | None = None  # Full sentiment analysis results
    processing_status: str = "pending"  # pending, completed, failed
    processed_at: datetime | None = None  # When processing occurred
    error_message: str | None = None  # Error if processing failed


class ReviewBase(BaseModel):
    user_id: PyObjectId
    business_id: PyObjectId
    location_id: PyObjectId | None = None
    source_id: PyObjectId
    job_id: PyObjectId
    data: dict
    source_type: str
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    analyzed_data: ProcessedData | None = Field(default=None)

    @model_validator(mode="after")
    def validate_data_based_on_source(self):
        if not self.source_type or self.source_type not in SOURCE_VALIDATORS:
            raise ValueError(f"Unsupported or missing source_type: {self.source_type}")

        validator = SOURCE_VALIDATORS[self.source_type]
        data = validator(self.data)
        return self

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {PyObjectId: str, datetime: lambda dt: dt.isoformat()}

    @field_validator("source_type")
    def validate_source_type(cls, v):
        if v not in settings.ALLOWED_SOURCE_TYPES:
            raise ValueError(
                f"Invalid source_type. Allowed: {settings.ALLOWED_SOURCE_TYPES}",
            )
        return v


class ReviewInDB(ReviewBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")


class ReviewResponse(ReviewBase):
    id: PyObjectId


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    data: dict | None = None
    source_type: str | None = None

    @model_validator(mode="after")
    def validate_data_based_on_source(self):
        if self.data and self.source_type:
            return SOURCE_VALIDATORS[self.source_type](self.data)
        return self
