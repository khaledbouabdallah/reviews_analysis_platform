# backend/app/models/stats.py
from pydantic import BaseModel, Field


class BusinessCounts(BaseModel):
    """Simple counts for a business"""

    business_id: str = Field(..., description="Business ID")
    business_name: str = Field(..., description="Business name")
    location_count: int = Field(..., description="Number of locations")
    source_count: int = Field(..., description="Number of sources")
    review_count: int = Field(..., description="Number of reviews")
    job_count: int = Field(..., description="Number of jobs")


class LocationBasicStats(BaseModel):
    """Basic stats for a location"""

    location_id: str = Field(..., description="Location ID")
    review_count: int = Field(..., description="Number of reviews")
    job_count: int = Field(..., description="Number of jobs")
    source_count: int = Field(..., description="Number of sources")
    average_rating: float = Field(..., description="Average rating of the location")


class SourceBasicStats(BaseModel):
    """Basic stats for a source"""

    source_id: str = Field(..., description="Source ID")
    review_count: int = Field(..., description="Number of reviews")
    job_count: int = Field(..., description="Number of jobs")
    average_rating: float = Field(..., description="Average rating of the source")
