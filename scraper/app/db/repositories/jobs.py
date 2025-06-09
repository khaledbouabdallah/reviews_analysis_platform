from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from bson import ObjectId
from db.mongodb import jobs_collection
from models.job import JobCreate, JobInDB, JobUpdate, JobUpdateInternal
from pymongo import ReturnDocument
from core.config import logger
from pymongo.errors import PyMongoError
from db.repositories.base_repository import BaseRepository
from db.mongodb import jobs_collection  

class JobRepository(BaseRepository[JobCreate, JobUpdate, JobInDB]):
    def __init__(self):
        super().__init__(jobs_collection, JobInDB)
        
        
    async def get_by_user(self, user_id: str, skip: int = 0, limit: int = 100) -> List[JobInDB]:
        """Get all jobs of a user."""
        try:
            oid = ObjectId(user_id)
        except Exception:
            raise ValueError("Invalid user_id format")

        try:
            jobs_data = await self.collection.find({"user_id": oid}).skip(skip).to_list(length=limit)
            return [self.db_model.model_validate(job) for job in jobs_data]
        except PyMongoError as e:
            raise RuntimeError("Database error")
        
        
    async def update_internal(self, job_id: str, update_data: JobUpdateInternal) -> JobInDB:
        """Update a job and return the updated document."""
        try:
            oid = ObjectId(job_id)
        except Exception:
            raise ValueError("Invalid job_id format")
        

        try:
            updated_job = await self.collection.find_one_and_update(
                {"_id": oid},
                {"$set": update_data.model_dump(by_alias=True, exclude_unset=True)},
                return_document=ReturnDocument.AFTER
            )

            if updated_job:
                return self.db_model.model_validate(updated_job)
            return None
        except PyMongoError as e:
            # Optionally log e
            raise RuntimeError("Database error while updating job")

    
