# app/models/llm_logs.py
from datetime import datetime, timezone
from typing import Any, Literal

from models import PyObjectId
from pydantic import BaseModel, Field


class RequestMetadata(BaseModel):
    """Metadata about the LLM request"""

    model_name: str = Field(..., description="LLM model used")
    tasks: list[str] = Field(..., description="Analysis tasks requested")
    batch_size: int = Field(..., ge=1, description="Number of reviews in batch")
    review_count: int = Field(..., ge=1, description="Total reviews processed")
    prompt_length: int | None = Field(None, description="Character length of prompt")


class PerformanceMetrics(BaseModel):
    """Performance and cost metrics"""

    duration_seconds: float = Field(
        ..., ge=0, description="Request duration in seconds"
    )
    input_tokens: int = Field(..., ge=0, description="Input tokens used")
    output_tokens: int = Field(..., ge=0, description="Output tokens generated")
    total_tokens: int = Field(..., ge=0, description="Total tokens used")
    cost: float = Field(..., ge=0, description="Cost in EUR")

    class Config:
        # Automatically calculate total_tokens if not provided
        @staticmethod
        def schema_extra(schema, model):
            schema["properties"]["total_tokens"]["default"] = (
                "input_tokens + output_tokens"
            )


class LLMResponse(BaseModel):
    """LLM response data"""

    raw_text: str = Field(..., description="Raw response from LLM")
    parsed_json: dict[str, Any] | None = Field(None, description="Parsed JSON response")
    success: bool = Field(..., description="Whether request was successful")
    error: str | None = Field(None, description="Error message if failed")
    # response_size_bytes: int | None = Field(
    #     None, description="Size of response in bytes"
    # )


class UsageContext(BaseModel):
    """Context about how the request was made"""

    source: Literal["api", "dashboard", "batch_job", "cron", "manual"] = Field(
        ..., description="Request source"
    )
    ip_address: str | None = Field(None, description="Client IP address")
    user_agent: str | None = Field(None, description="Client user agent")
    subscription_tier: str | None = Field(None, description="User subscription tier")
    api_version: str | None = Field(None, description="API version used")
    endpoint: str | None = Field(None, description="API endpoint called")


class LLMResponseLogBase(BaseModel):
    """Complete LLM response log entry"""

    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Request timestamp",
    )

    user_id: PyObjectId = Field(..., description="User who made the request")

    # Nested models
    request_metadata: RequestMetadata = Field(..., description="Request metadata")
    performance: PerformanceMetrics = Field(..., description="Performance metrics")
    llm_response: LLMResponse = Field(..., description="LLM response data")
    usage_context: UsageContext = Field(..., description="Usage context")

    # Additional fields for analytics
    tags: list[str] | None = Field(
        default_factory=list, description="Tags for categorization"
    )
    experiment_id: str | None = Field(None, description="A/B test or experiment ID")

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {PyObjectId: str, datetime: lambda dt: dt.isoformat()},
    }


class LLMLogCreate(LLMResponseLogBase):
    pass


class LLMLogInDB(LLMResponseLogBase):
    """LLM log entry stored in the database"""

    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")


class LLMLogUpdate(BaseModel):
    """Fields that can be updated in an existing LLM log entry"""

    usage_context: UsageContext | None = Field(None, description="Usage context")
    tags: list[str] | None = Field(None, description="Tags for categorization")
    experiment_id: str | None = Field(None, description="A/B test or experiment ID")
