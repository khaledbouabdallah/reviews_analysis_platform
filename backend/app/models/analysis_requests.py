from typing import Any

from models.analysis_schemas import AnalysisTask
from pydantic import BaseModel, Field


class ReviewInput(BaseModel):
    """Standardized review input for LLM analysis"""

    text: str = Field(..., description="Review text content")
    rating: int | None = Field(None, ge=1, le=5, description="Review rating 1-5")
    business_type: str | None = Field(None, description="Type of business")
    source: str | None = Field("unknown", description="Review source platform")
    metadata: dict[str, Any] | None = Field(default_factory=dict)


class BatchReviewRequest(BaseModel):
    """Batch analysis request"""

    reviews: list[ReviewInput] = Field(..., min_items=1, max_items=100)
    tasks: list[AnalysisTask] = Field(..., min_items=1)
    target_topics: list[str] | None = None
    business_context: str | None = None
