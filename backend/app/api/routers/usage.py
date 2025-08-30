# backend/app/api/routers/usage.py
from api.dependencies import get_current_active_user
from core.config import logger
from fastapi import APIRouter, Depends, HTTPException, status
from models.usage import CurrentUsageResponse
from models.user import UserInDB
from models.subscription import SubscriptionPlan, SUBSCRIPTION_PLANS
from services.subscription_service import subscription_service

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("/current", response_model=CurrentUsageResponse)
async def get_current_usage(
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Get current usage statistics for the authenticated user"""
    try:
        usage = await subscription_service.get_current_usage(str(current_user.id))
        return usage
    
    except ValueError as e:
        logger.error(f"Error getting usage for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error getting usage for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve usage information"
        )


@router.get("/plans", response_model=dict[str, SubscriptionPlan])
async def get_subscription_plans():
    """Get all available subscription plans"""
    return SUBSCRIPTION_PLANS


@router.get("/limits")
async def get_usage_limits(
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Get current usage limits for the authenticated user"""
    try:
        limits = current_user.get_limits()
        return {
            "subscription_tier": current_user.subscription.tier,
            "subscription_status": current_user.subscription.status,
            "limits": limits.model_dump(),
            "billing_cycle": current_user.subscription.billing_cycle,
            "current_period_end": current_user.subscription.current_period_end
        }
    
    except Exception as e:
        logger.error(f"Error getting limits for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve usage limits"
        )