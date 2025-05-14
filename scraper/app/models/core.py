from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
import re
import datetime


class JobStatus(BaseModel):
    job_id: str
    status: str
    creation_time: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    total_reviews: Optional[int] = None
    reviews_scraped: Optional[int] = None
    error: Optional[str] = None
    
    
class ScraperConfig(BaseModel):
    url: str
    headless: bool = True
    timeout: int = 10
    original: bool = True
    language: str = "en"
    concat_extra: bool = False
    path: str = "data"
    name: str = "reviews"
    timestamp: bool = True
    
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