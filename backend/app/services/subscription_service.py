# backend/app/services/subscription_service.py
from datetime import datetime, timezone
from typing import Literal

from db.repositories.businesses import BusinessRepository
from db.repositories.llm_logs import LLMLogRepository
from db.repositories.locations import LocationRepository  
from db.repositories.sources import SourceRepository
from db.repositories.users import UserRepository
from models.usage import CurrentUsageResponse, MonthlyUsage, UsageEvent, get_billing_cycle_dates
from models.user import UserInDB


class SubscriptionService:
    """Service for subscription management, usage tracking, and limit checking"""
    
    def __init__(self):
        self.user_repo = UserRepository()
        self.business_repo = BusinessRepository()
        self.location_repo = LocationRepository()
        self.source_repo = SourceRepository()
        self.llm_log_repo = LLMLogRepository()
    
    async def get_current_usage(self, user_id: str) -> CurrentUsageResponse:
        """Get current usage for a user in their billing cycle"""
        
        # Get user and subscription info
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        limits = user.get_limits()
        
        # Calculate billing cycle dates
        cycle_start, cycle_end = get_billing_cycle_dates(
            user.subscription.current_period_start,
            user.subscription.billing_cycle
        )
        
        # Get current resource counts
        businesses_count = len(await self.business_repo.get_by_user(user_id))
        locations_count = len(await self.location_repo.get_by_user(user_id))
        sources_count = len(await self.source_repo.get_by_user(user_id))
        
        # Get usage for current billing cycle from LLM logs
        tokens_used, reviews_used = await self._calculate_cycle_usage(user_id, cycle_start, cycle_end)
        
        # Calculate percentages and warnings
        reviews_percentage = (reviews_used / limits.reviews_per_month * 100) if limits.reviews_per_month > 0 else 0
        tokens_percentage = (tokens_used / limits.tokens_per_month * 100) if limits.tokens_per_month > 0 else 0
        
        is_approaching_limit = reviews_percentage > 80 or tokens_percentage > 80
        limit_warnings = []
        
        if reviews_percentage > 80:
            limit_warnings.append(f"Review scraping limit: {reviews_percentage:.1f}% used")
        if tokens_percentage > 80:
            limit_warnings.append(f"AI analysis tokens: {tokens_percentage:.1f}% used")
        
        # Days remaining in billing cycle
        days_remaining = (cycle_end - datetime.now(timezone.utc)).days
        
        return CurrentUsageResponse(
            billing_cycle_start=cycle_start,
            billing_cycle_end=cycle_end,
            days_remaining=days_remaining,
            reviews_used=reviews_used,
            reviews_limit=limits.reviews_per_month,
            tokens_used=tokens_used,
            tokens_limit=limits.tokens_per_month,
            businesses_count=businesses_count,
            businesses_limit=limits.businesses,
            locations_count=locations_count,
            locations_limit=limits.locations,
            sources_count=sources_count,
            sources_limit=limits.sources,
            reviews_percentage=reviews_percentage,
            tokens_percentage=tokens_percentage,
            subscription_tier=user.subscription.tier,
            subscription_status=user.subscription.status,
            is_approaching_limit=is_approaching_limit,
            limit_warnings=limit_warnings
        )
    
    async def _calculate_cycle_usage(self, user_id: str, cycle_start: datetime, cycle_end: datetime) -> tuple[int, int]:
        """Calculate tokens used and reviews scraped in current billing cycle"""
        
        # Get LLM logs for this billing cycle
        llm_logs = await self.llm_log_repo.get_by_user_date_range(user_id, cycle_start, cycle_end)
        
        total_tokens = 0
        total_reviews = 0
        
        for log in llm_logs:
            if log.performance:
                total_tokens += log.performance.total_tokens
                total_reviews += log.request_metadata.review_count
        
        return total_tokens, total_reviews
    
    async def check_can_create_business(self, user_id: str) -> tuple[bool, str]:
        """Check if user can create another business"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return False, "User not found"
        
        if not user.is_subscription_active():
            return False, "Subscription is not active"
        
        limits = user.get_limits()
        if limits.businesses == -1:  # Unlimited
            return True, ""
        
        current_count = len(await self.business_repo.get_by_user(user_id))
        if current_count >= limits.businesses:
            return False, f"Business limit reached ({current_count}/{limits.businesses}). Upgrade your plan to add more businesses."
        
        return True, ""
    
    async def check_can_create_location(self, user_id: str) -> tuple[bool, str]:
        """Check if user can create another location"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return False, "User not found"
        
        if not user.is_subscription_active():
            return False, "Subscription is not active"
        
        limits = user.get_limits()
        if limits.locations == -1:  # Unlimited
            return True, ""
        
        current_count = len(await self.location_repo.get_by_user(user_id))
        if current_count >= limits.locations:
            return False, f"Location limit reached ({current_count}/{limits.locations}). Upgrade your plan to add more locations."
        
        return True, ""
    
    async def check_can_create_source(self, user_id: str) -> tuple[bool, str]:
        """Check if user can create another source"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return False, "User not found"
        
        if not user.is_subscription_active():
            return False, "Subscription is not active"
        
        limits = user.get_limits()
        if limits.sources == -1:  # Unlimited
            return True, ""
        
        current_count = len(await self.source_repo.get_by_user(user_id))
        if current_count >= limits.sources:
            return False, f"Source limit reached ({current_count}/{limits.sources}). Upgrade your plan to add more sources."
        
        return True, ""
    
    async def check_can_scrape_reviews(self, user_id: str, review_count: int) -> tuple[bool, str]:
        """Check if user can scrape more reviews this billing cycle"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return False, "User not found"
        
        if not user.is_subscription_active():
            return False, "Subscription is not active"
        
        # Get current usage
        usage = await self.get_current_usage(user_id)
        
        if usage.reviews_used + review_count > usage.reviews_limit:
            return False, f"Review scraping limit exceeded. You have {usage.reviews_limit - usage.reviews_used} reviews remaining this billing cycle."
        
        return True, ""
    
    async def check_can_analyze_reviews(self, user_id: str, estimated_tokens: int) -> tuple[bool, str]:
        """Check if user can perform AI analysis with estimated token usage"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return False, "User not found"
        
        if not user.is_subscription_active():
            return False, "Subscription is not active"
        
        # Get current usage
        usage = await self.get_current_usage(user_id)
        
        if usage.tokens_used + estimated_tokens > usage.tokens_limit:
            return False, f"AI analysis token limit exceeded. You have {usage.tokens_limit - usage.tokens_used} tokens remaining this billing cycle."
        
        return True, ""
    
    async def track_usage_event(self, user_id: str, event_type: str, **kwargs) -> UsageEvent:
        """Track a usage event for billing and analytics"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        cycle_start, _ = get_billing_cycle_dates(
            user.subscription.current_period_start,
            user.subscription.billing_cycle
        )
        
        usage_event = UsageEvent(
            user_id=user.id,
            event_type=event_type,
            resource_id=kwargs.get("resource_id"),
            tokens_consumed=kwargs.get("tokens_consumed", 0),
            reviews_processed=kwargs.get("reviews_processed", 0),
            cost=kwargs.get("cost", 0.0),
            subscription_tier=user.subscription.tier,
            billing_cycle_start=cycle_start
        )
        
        # TODO: Save to usage_events collection
        # await self.usage_event_repo.create(usage_event)
        
        return usage_event
    
    async def upgrade_subscription(self, user_id: str, new_tier: str) -> bool:
        """Upgrade user subscription tier"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return False
        
        # Update subscription tier
        user.subscription.tier = new_tier
        user.subscription.status = "active"  # Reset to active on upgrade
        
        # TODO: Handle prorating and billing logic here
        
        await self.user_repo.update(user_id, {"subscription": user.subscription})
        return True
    
    async def reset_billing_cycle(self, user_id: str) -> bool:
        """Reset usage counters for new billing cycle (called by billing system)"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return False
        
        # Calculate new billing cycle dates
        cycle_start, cycle_end = get_billing_cycle_dates(
            user.subscription.current_period_start,
            user.subscription.billing_cycle
        )
        
        # Update user's billing period
        user.subscription.current_period_start = cycle_start
        user.subscription.current_period_end = cycle_end
        
        await self.user_repo.update(user_id, {"subscription": user.subscription})
        
        # TODO: Archive previous cycle usage to billing history
        # TODO: Create new monthly usage record
        
        return True


# Global subscription service instance
subscription_service = SubscriptionService()