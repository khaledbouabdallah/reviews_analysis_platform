# backend/app/services/cleanup.py
from datetime import datetime, timezone
from core.config import logger
from db.mongodb import users_collection


async def cleanup_expired_verification_tokens():
    """Remove expired verification tokens from users collection"""
    try:
        current_time = datetime.now(timezone.utc)
        
        result = await users_collection.update_many(
            {
                "verification_token_expires": {"$lt": current_time},
                "verification_token": {"$ne": None}
            },
            {
                "$unset": {
                    "verification_token": "",
                    "verification_token_expires": ""
                },
                "$set": {
                    "updated_at": current_time
                }
            }
        )
        
        if result.modified_count > 0:
            logger.info(f"Cleaned up {result.modified_count} expired verification tokens")
        
        return result.modified_count
        
    except Exception as e:
        logger.error(f"Failed to cleanup expired verification tokens: {e}")
        return 0


async def cleanup_unverified_old_users(days_old: int = 30):
    """Remove unverified users older than specified days"""
    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_old)
        
        result = await users_collection.delete_many({
            "email_verified": False,
            "created_at": {"$lt": cutoff_date}
        })
        
        if result.deleted_count > 0:
            logger.info(f"Deleted {result.deleted_count} unverified users older than {days_old} days")
        
        return result.deleted_count
        
    except Exception as e:
        logger.error(f"Failed to cleanup old unverified users: {e}")
        return 0


# Optional: Add this to a background task or cron job
# You can call these functions periodically to keep your database clean