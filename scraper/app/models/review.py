from pydantic import BaseModel, Field, field_validator
from typing import Dict, Optional
from datetime import datetime
from models import PyObjectId
from core import settings


def validate_google_review(data):
    required_fields = ['text', 'rating', 'author', 'review_id']
    missing = [f for f in required_fields if f not in data]
    if missing:
        raise ValueError(f"Google review is missing required fields: {missing}")
    return data

def validate_csv_review(data):
    if 'text' not in data:
        raise ValueError("CSV review must contain at least 'text' field")
    return data


SOURCE_VALIDATORS = {
    "google": validate_google_review,
    "csv": validate_csv_review,
}


class ReviewBase(BaseModel):
    user_id: PyObjectId
    business_id: PyObjectId
    source_id: PyObjectId
    job_id: PyObjectId
    review_id: str
    data: Dict
    source_type: str
    created_at: datetime = Field(default_factory=lambda: datetime.now())

    @field_validator('data')
    def validate_data_based_on_source(cls, v, values):
        source_type = values.get('source_type')
        if not source_type or source_type not in SOURCE_VALIDATORS:
            raise ValueError(f"Unsupported or missing source_type: {source_type}")

        validator = SOURCE_VALIDATORS[source_type]
        return validator(v)

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            PyObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
        
    @field_validator('source_type')
    def validate_source_type(cls, v):
        if v not in settings.ALLOWED_SOURCE_TYPES:
            raise ValueError(f"Invalid source_type. Allowed: {settings.ALLOWED_SOURCE_TYPES}")
        return v
    
class ReviewInDB(ReviewBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    
class ReviewCreate(ReviewBase):
    pass
    

    
