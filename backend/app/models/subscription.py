from datetime import datetime, timezone
from typing import Annotated, Literal
from pydantic import BaseModel, Field

# Subscription tier definitions
SubscriptionTier = Literal["starter", "growth", "scale"]

# Subscription limits configuration
SUBSCRIPTION_LIMITS = {
    "starter": {
        "businesses": 2,
        "locations": 5,
        "sources": 10,
        "reviews_per_month": 500,
        "tokens_per_month": 10000,
        "price_monthly": 0,
        "price_yearly": 0,
    },
    "growth": {
        "businesses": 10,
        "locations": 50,
        "sources": 100,
        "reviews_per_month": 5000,
        "tokens_per_month": 200000,
        "price_monthly": 39,
        "price_yearly": 390,  # 10 months price
    },
    "scale": {
        "businesses": -1,  # -1 means unlimited
        "locations": -1,
        "sources": -1,
        "reviews_per_month": 25000,
        "tokens_per_month": 1000000,
        "price_monthly": 129,
        "price_yearly": 1290,  # 10 months price
    }
}

class UsageLimits(BaseModel):
    """Current usage limits based on subscription tier"""
    businesses: int = Field(..., description="Max businesses allowed (-1 = unlimited)")
    locations: int = Field(..., description="Max locations allowed (-1 = unlimited)")
    sources: int = Field(..., description="Max sources allowed (-1 = unlimited)")
    reviews_per_month: int = Field(..., description="Max reviews to scrape per month")
    tokens_per_month: int = Field(..., description="Max AI analysis tokens per month")

# Model for subscription plan information (public)
class SubscriptionPlan(BaseModel):
    """Public subscription plan information"""
    tier: SubscriptionTier
    name: str
    description: str
    limits: UsageLimits
    price_monthly: int  # in cents
    price_yearly: int   # in cents
    features: list[str]


# Pre-defined subscription plans for frontend
SUBSCRIPTION_PLANS = {
    "starter": SubscriptionPlan(
        tier="starter",
        name="Starter",
        description="Perfect for trying out review analysis",
        limits=UsageLimits(**{k: v for k, v in SUBSCRIPTION_LIMITS["starter"].items() if k not in ["price_monthly", "price_yearly"]}),
        price_monthly=0,
        price_yearly=0,
        features=[
            "2 businesses",
            "5 locations per business", 
            "10 review sources",
            "500 reviews scraped/month",
            "10K AI analysis tokens/month",
            "Basic analytics dashboard"
        ]
    ),
    "growth": SubscriptionPlan(
        tier="growth", 
        name="Growth",
        description="For growing businesses scaling their review management",
        limits=UsageLimits(**{k: v for k, v in SUBSCRIPTION_LIMITS["growth"].items() if k not in ["price_monthly", "price_yearly"]}),
        price_monthly=3900,  # $39.00 in cents
        price_yearly=39000,  # $390.00 in cents  
        features=[
            "10 businesses",
            "50 locations per business",
            "100 review sources", 
            "5,000 reviews scraped/month",
            "200K AI analysis tokens/month",
            "Advanced analytics & insights",
            "Email alerts & notifications",
            "Priority support"
        ]
    ),
    "scale": SubscriptionPlan(
        tier="scale",
        name="Scale", 
        description="For enterprises managing multiple brands and locations",
        limits=UsageLimits(**{k: v for k, v in SUBSCRIPTION_LIMITS["scale"].items() if k not in ["price_monthly", "price_yearly"]}),
        price_monthly=12900,  # $129.00 in cents
        price_yearly=129000,  # $1,290.00 in cents
        features=[
            "Unlimited businesses & locations",
            "Unlimited review sources",
            "25,000 reviews scraped/month", 
            "1M AI analysis tokens/month",
            "Custom analytics & reporting",
            "Real-time alerts & webhooks",
            "Custom integrations",
            "Dedicated success manager",
            "SLA guarantee"
        ]
    )
}


class SubscriptionInfo(BaseModel):
    """User subscription information"""
    tier: SubscriptionTier = Field(default="starter", description="Subscription tier")
    billing_cycle: Literal["monthly", "yearly"] = Field(default="monthly", description="Billing cycle")
    status: Literal["active", "past_due", "canceled", "trialing"] = Field(default="active", description="Subscription status")
    
    # Billing dates
    current_period_start: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Current billing period start")
    current_period_end: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(month=datetime.now().month+1 if datetime.now().month < 12 else 1), description="Current billing period end")
    trial_end: datetime | None = Field(default=None, description="Trial period end date")
    
    # Payment integration fields (for future billing)
    stripe_customer_id: str | None = Field(default=None, description="Stripe customer ID")
    stripe_subscription_id: str | None = Field(default=None, description="Stripe subscription ID")
    last_payment_date: datetime | None = Field(default=None, description="Last successful payment date")
    next_payment_date: datetime | None = Field(default=None, description="Next payment due date")




