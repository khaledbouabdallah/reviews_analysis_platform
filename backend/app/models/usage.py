# backend/app/models/usage.py
from datetime import datetime, timezone
from typing import Literal

from models import PyObjectId
from pydantic import BaseModel, Field


class MonthlyUsage(BaseModel):
    """Monthly usage tracking for billing cycles"""
    
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="User ID")
    
    # Billing period
    year: int = Field(..., description="Year of usage")
    month: int = Field(..., description="Month of usage (1-12)")
    billing_cycle_start: datetime = Field(..., description="Start of billing cycle")
    billing_cycle_end: datetime = Field(..., description="End of billing cycle")
    
    # Usage counters
    reviews_scraped: int = Field(default=0, description="Reviews scraped this cycle")
    tokens_used: int = Field(default=0, description="AI analysis tokens used this cycle")
    analysis_requests: int = Field(default=0, description="Number of analysis API calls")
    
    # Resource counts (current snapshot)
    businesses_count: int = Field(default=0, description="Current number of businesses")
    locations_count: int = Field(default=0, description="Current number of locations") 
    sources_count: int = Field(default=0, description="Current number of sources")
    
    # Subscription info at time of usage
    subscription_tier: str = Field(..., description="User's subscription tier during this period")
    
    # Tracking
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
    }


class UsageEvent(BaseModel):
    """Individual usage event for detailed tracking"""
    
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="User ID")
    
    event_type: Literal["review_scraped", "analysis_performed", "business_created", "location_created", "source_created"] = Field(
        ..., description="Type of usage event"
    )
    
    # Event details
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resource_id: str | None = Field(None, description="ID of related resource (business_id, source_id, etc)")
    
    # Usage metrics
    tokens_consumed: int = Field(default=0, description="Tokens used in this event")
    reviews_processed: int = Field(default=0, description="Reviews processed in this event")
    cost: float = Field(default=0.0, description="Cost of this operation in EUR")
    
    # Context
    subscription_tier: str = Field(..., description="User's subscription tier at time of event")
    billing_cycle_start: datetime = Field(..., description="Billing cycle when event occurred")
    
    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
    }


class CurrentUsageResponse(BaseModel):
    """Response model for current usage API"""
    
    # Current billing cycle info
    billing_cycle_start: datetime
    billing_cycle_end: datetime
    days_remaining: int
    
    # Current usage vs limits
    reviews_used: int
    reviews_limit: int
    tokens_used: int 
    tokens_limit: int
    
    # Resource counts vs limits  
    businesses_count: int
    businesses_limit: int  # -1 for unlimited
    locations_count: int
    locations_limit: int   # -1 for unlimited
    sources_count: int
    sources_limit: int     # -1 for unlimited
    
    # Usage percentages for UI
    reviews_percentage: float = Field(description="Percentage of review limit used")
    tokens_percentage: float = Field(description="Percentage of token limit used")
    
    # Subscription info
    subscription_tier: str
    subscription_status: str
    is_approaching_limit: bool = Field(description="True if any usage > 80%")
    limit_warnings: list[str] = Field(description="List of resources approaching limits")


class BillingHistoryEntry(BaseModel):
    """Billing history record (preparation for payment integration)"""
    
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id") 
    user_id: PyObjectId = Field(..., description="User ID")
    
    # Billing period
    billing_period_start: datetime = Field(..., description="Start of billing period")
    billing_period_end: datetime = Field(..., description="End of billing period")
    
    # Subscription info
    subscription_tier: str = Field(..., description="Subscription tier for this period")
    billing_cycle: Literal["monthly", "yearly"] = Field(..., description="Billing cycle")
    
    # Usage during period
    usage_summary: MonthlyUsage = Field(..., description="Usage summary for this billing period")
    
    # Billing details
    base_amount: int = Field(..., description="Base subscription amount in cents")
    overage_amount: int = Field(default=0, description="Overage charges in cents")
    total_amount: int = Field(..., description="Total amount charged in cents")
    currency: str = Field(default="EUR", description="Currency code")
    
    # Payment status
    payment_status: Literal["pending", "paid", "failed", "refunded"] = Field(default="pending")
    payment_date: datetime | None = Field(None, description="Date payment was processed")
    stripe_invoice_id: str | None = Field(None, description="Stripe invoice ID")
    
    # Tracking
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
    }


# Helper function to calculate billing cycle dates
def get_billing_cycle_dates(user_subscription_start: datetime, billing_cycle: str) -> tuple[datetime, datetime]:
    """Calculate current billing cycle start and end dates"""
    now = datetime.now(timezone.utc)
    
    if billing_cycle == "monthly":
        # Find the current month's billing cycle
        start_day = user_subscription_start.day
        
        # Current month cycle
        if now.day >= start_day:
            cycle_start = now.replace(day=start_day, hour=0, minute=0, second=0, microsecond=0)
        else:
            # Previous month cycle
            if now.month == 1:
                cycle_start = now.replace(year=now.year-1, month=12, day=start_day, hour=0, minute=0, second=0, microsecond=0)
            else:
                cycle_start = now.replace(month=now.month-1, day=start_day, hour=0, minute=0, second=0, microsecond=0)
        
        # Next cycle start
        if cycle_start.month == 12:
            cycle_end = cycle_start.replace(year=cycle_start.year+1, month=1)
        else:
            cycle_end = cycle_start.replace(month=cycle_start.month+1)
            
    else:  # yearly
        start_month = user_subscription_start.month
        start_day = user_subscription_start.day
        
        # Current year cycle  
        if (now.month > start_month) or (now.month == start_month and now.day >= start_day):
            cycle_start = now.replace(month=start_month, day=start_day, hour=0, minute=0, second=0, microsecond=0)
        else:
            # Previous year cycle
            cycle_start = now.replace(year=now.year-1, month=start_month, day=start_day, hour=0, minute=0, second=0, microsecond=0)
        
        cycle_end = cycle_start.replace(year=cycle_start.year+1)
    
    return cycle_start, cycle_end