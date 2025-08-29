from datetime import datetime
from typing import List
from models import PyObjectId
from core.config import logger
from db.mongodb import llm_logs_collection
from db.repositories.base_repository import BaseRepository
from models.llm_log import LLMLogCreate, LLMLogInDB, LLMLogUpdate


class LLMLogRepository(BaseRepository[LLMLogCreate, LLMLogUpdate, LLMLogInDB]):
    def __init__(self):
        super().__init__(llm_logs_collection, LLMLogInDB)
        
    async def get_by_user_date_range(
        self, 
        user_id: str, 
        start_date: datetime, 
        end_date: datetime,
        skip: int = 0,
        limit: int = 1000
    ) -> List[LLMLogInDB]:
        """Get LLM logs for a user within a date range"""
        try:
            user_oid = PyObjectId(user_id)
            
            query = {
                "user_id": user_oid,
                "timestamp": {
                    "$gte": start_date,
                    "$lt": end_date
                }
            }
            
            cursor = llm_logs_collection.find(query).skip(skip).limit(limit).sort("timestamp", -1)
            logs_data = await cursor.to_list(length=limit)
            
            return [LLMLogInDB.model_validate(log_data) for log_data in logs_data]
            
        except Exception as e:
            logger.error(f"Error fetching LLM logs for user {user_id} in date range: {e}")
            return []
    
    async def get_usage_summary(
        self, 
        user_id: str, 
        start_date: datetime, 
        end_date: datetime
    ) -> dict:
        """Get aggregated usage summary for a user in date range"""
        try:
            user_oid = PyObjectId(user_id)
            
            pipeline = [
                {
                    "$match": {
                        "user_id": user_oid,
                        "timestamp": {"$gte": start_date, "$lt": end_date}
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "total_tokens": {"$sum": "$performance.total_tokens"},
                        "total_reviews": {"$sum": "$request_metadata.review_count"},
                        "total_requests": {"$sum": 1},
                        "total_cost": {"$sum": "$performance.cost"}
                    }
                }
            ]
            
            result = await llm_logs_collection.aggregate(pipeline).to_list(length=1)
            
            if result:
                return {
                    "total_tokens": result[0].get("total_tokens", 0),
                    "total_reviews": result[0].get("total_reviews", 0), 
                    "total_requests": result[0].get("total_requests", 0),
                    "total_cost": result[0].get("total_cost", 0.0)
                }
            else:
                return {
                    "total_tokens": 0,
                    "total_reviews": 0,
                    "total_requests": 0,
                    "total_cost": 0.0
                }
                
        except Exception as e:
            logger.error(f"Error getting usage summary for user {user_id}: {e}")
            return {
                "total_tokens": 0,
                "total_reviews": 0,
                "total_requests": 0,
                "total_cost": 0.0
            }
