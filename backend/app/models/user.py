# backend/app/models/user.py
from datetime import datetime, timezone
from typing import Annotated, Literal, Optional

from models import PyObjectId
from pydantic import BaseModel, EmailStr, Field, field_serializer, model_validator
from models.subscription import SUBSCRIPTION_LIMITS, UsageLimits, SubscriptionTier, SubscriptionInfo


# Base User model with common fields
class UserBase(BaseModel):
    username: Annotated[str, Field(min_length=3, max_length=50)]
    email: EmailStr | None = None
    disabled: bool = False

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {PyObjectId: str, datetime: lambda dt: dt.isoformat()},
    }


# Model for user in database
class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime | None = None
    
    # Email verification fields
    email_verified: bool = Field(default=False)
    verification_token: Optional[str] = Field(default=None)
    verification_token_expires: Optional[datetime] = Field(default=None)
    
    # Subscription information
    subscription: SubscriptionInfo = Field(default_factory=SubscriptionInfo)
    
    def get_limits(self) -> UsageLimits:
        """Get current usage limits based on subscription tier"""
        limits = SUBSCRIPTION_LIMITS[self.subscription.tier]
        return UsageLimits(
            businesses=limits["businesses"],
            locations=limits["locations"], 
            sources=limits["sources"],
            reviews_per_month=limits["reviews_per_month"],
            tokens_per_month=limits["tokens_per_month"]
        )
    
    def is_subscription_active(self) -> bool:
        """Check if subscription is currently active"""
        now = datetime.now(timezone.utc)
        return (
            self.subscription.status in ["active", "trialing"] and
            self.subscription.current_period_end > now
        )
    
    def is_verification_token_valid(self) -> bool:
        """Check if verification token is still valid"""
        if not self.verification_token or not self.verification_token_expires:
            return False
        return datetime.now(timezone.utc) < self.verification_token_expires


# Model for creating a new user
class UserCreate(UserBase):
    password: Annotated[str, Field(min_length=8)]
    email: EmailStr
    subscription_tier: SubscriptionTier = Field(default="starter", description="Initial subscription tier")
    recaptcha_token: str = Field(description="reCAPTCHA v3 token")


# TODO: MAKE internal update model 
# Model for updating an existing user
class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8)
    disabled: bool | None = None
    subscription: SubscriptionInfo | None = None
    email_verified: bool | None = None

    model_config = {"arbitrary_types_allowed": True}

    @model_validator(mode="after")
    def check_at_least_one_field(self) -> "UserUpdate":
        if all(
            v is None for v in [self.username, self.email, self.password, self.disabled, self.subscription, self.email_verified]
        ):
            raise ValueError("At least one field must be provided for update")
        return self


# Response model for API clients
class UserResponse(BaseModel):
    id: PyObjectId
    username: str
    email: EmailStr | None = None
    disabled: bool = False
    email_verified: bool = False
    created_at: datetime
    updated_at: datetime | None = None
    subscription: SubscriptionInfo

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}

    @field_serializer("id")
    def serialize_id(self, id: PyObjectId) -> str:
        return str(id)

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, dt: datetime | None) -> str | None:
        if dt:
            return dt.isoformat()
        return None


# Model for email verification request
class EmailVerificationRequest(BaseModel):
    token: str = Field(description="Email verification token")


# Model for resend verification request
class ResendVerificationRequest(BaseModel):
    email: EmailStr = Field(description="Email to resend verification to")
    recaptcha_token: str = Field(description="reCAPTCHA v3 token")