from typing import List, Optional, Dict
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
from models import PyObjectId
import re

class JobBase(BaseModel):
    title: str
    status: str
    url: str
    creation_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    total_reviews: Optional[int] = None
    reviews_scraped: Optional[int] = None
    error: Optional[str] = None
    reviews: List[Dict] = []


    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {
            PyObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
    }
    
    @field_validator('url')
    def validate_google_maps_url(cls, v):
        # Pattern to match Google Maps URLs
        
        
        google_maps_pattern = r'^https?://(www\.)?(google\.[a-z]{2,3}(/maps)?|maps\.google\.[a-z]{2,3})/.+$'
        
        if not re.match(google_maps_pattern, v):
            raise ValueError("URL must be a valid Google Maps link")
        
        # Method 1: Check for !4m18 or !4m8 parameter (most reliable)
        if re.search(r'!4m(18|8)\!', v):
            return v

        # Method 2: Check for !3m7 parameter (also reliable)
        if re.search(r'!3m7!', v):
            return v

        # Method 3: Count !9m1!1b1 occurrences (less reliable but can be used as backup)
        if v.count('!9m1!1b1') >= 2:
            return v

        raise ValueError("URL must contain a valid Google Maps reviews section")
        
    @field_validator('status')
    def validate_status(cls, value):
        if value not in ["pending", "running", "completed", "failed"]:
            raise ValueError("Invalid status value")
        return value
       
class JobCreate(JobBase):
    """Used for creating a new job."""
    status: str = Field(default="pending")
    user_id: Optional[PyObjectId] = None # TODO: to be implemented later
       
class JobInDB(JobBase):
    """Used internally and for DB storage."""
    job_id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: Optional[PyObjectId] = None # TODO: to be implemented later
    
class JobUpdate(BaseModel):
    """Used for updating an existing job."""
    title: Optional[str] = None
    status: Optional[str] = None
    
class JobUpdateInternal(JobBase):
    title: Optional[str] = None
    status: Optional[str] = None
    url: Optional[str] = None
    creation_time : Optional[datetime] = None
    
               
class JobResponse(JobBase):
    job_id: PyObjectId = Field(alias="_id")
    user_id: Optional[PyObjectId] = None # TODO: to be implemented later
    
    
