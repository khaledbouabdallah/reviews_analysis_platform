from db.repositories.base_repository import BaseRepository
from db.mongodb import sources_collection, users_collection, busniesses_collection
from models.source import SourceCreate, SourceUpdate, SourceInDB, SourceResponse
from models import PyObjectId
from pymongo import ReturnDocument
from pymongo.errors import PyMongoError, DuplicateKeyError
from typing import List, Optional
from db.repositories.helpers import ValidatorHelper
from core.config import logger


class SourceRepository(BaseRepository[SourceCreate, SourceUpdate, SourceInDB]):
    def __init__(self):
        super().__init__(sources_collection, SourceInDB)
        
    
    async def create(self, business_create: SourceCreate) -> SourceInDB:
        try:
            await ValidatorHelper.get_user_or_raise(users_collection, business_create.user_id)
            await ValidatorHelper.get_business_or_raise(busniesses_collection, business_create.user_id, business_create.business_id)

            # Insert business
            result = await self.collection.insert_one(business_create.model_dump(by_alias=True))

            created_business = await self.collection.find_one({"_id": result.inserted_id})
            if created_business:
                return self.db_model.model_validate(created_business)
            raise RuntimeError("Failed to retrieve created document")

        except DuplicateKeyError:
            raise ValueError("Business with this name already exists")

        except PyMongoError as e:
            logger.error(f"Database error while creating business: {str(e)}")
            raise RuntimeError("Database error while creating document")

        except ValueError as e:
            raise ValueError(f"Invalid data: {str(e)}")

        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            raise RuntimeError(f"Unexpected error: {str(e)}")
    
        
        
    async def get_by_user(self, user_id: str, skip: int = 0, limit: int = 100) -> List[SourceInDB]:
        """Get all jobs of a user."""
        try:
            oid = PyObjectId(user_id)
        except Exception:
            raise ValueError("Invalid user_id format")

        try:
            jobs_data = await self.collection.find({"user_id": oid}).skip(skip).to_list(length=limit)
            return [self.db_model.model_validate(job) for job in jobs_data]
        except PyMongoError as e:
            raise RuntimeError("Database error")
        
        
            
    async def get_by_busnisse(self, business_id: str, skip: int = 0, limit: int = 100) -> List[SourceInDB]:
        """Get all jobs of a business."""
        try:
            oid = PyObjectId(business_id)
        except Exception:
            raise ValueError("Invalid user_id format")

        try:
            jobs_data = await self.collection.find({"user_id": oid}).skip(skip).to_list(length=limit)
            return [self.db_model.model_validate(job) for job in jobs_data]
        except PyMongoError as e:
            raise RuntimeError("Database error")
        
