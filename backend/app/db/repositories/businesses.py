# backend/app/db/repositories/businesses.py (CLEAN VERSION)
from db.repositories.base_repository import BaseRepository
from db.mongodb import busniesses_collection, users_collection
from db.repositories.sources import SourceRepository
from db.repositories.jobs import JobRepository
from db.repositories.reviews import ReviewRepository
from models.business import BusinessCreate, BusinessUpdate, BusinessInDB
from models import PyObjectId
from pymongo import ReturnDocument
from pymongo.errors import PyMongoError, DuplicateKeyError
from typing import List, Optional
from db.repositories.helpers import ValidatorHelper
from core.config import logger


class BusinessRepository(BaseRepository[BusinessCreate, BusinessUpdate, BusinessInDB]):
    def __init__(self):
        super().__init__(busniesses_collection, BusinessInDB)

    async def create(self, business_create: BusinessCreate) -> BusinessInDB:
        try:
            await ValidatorHelper.get_user_or_raise(
                users_collection, business_create.user_id
            )

            # Insert business
            result = await self.collection.insert_one(
                business_create.model_dump(by_alias=True)
            )

            created_business = await self.collection.find_one(
                {"_id": result.inserted_id}
            )
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

    async def get_by_user(
        self, user_id: str, skip: int = 0, limit: int = 100
    ) -> List[BusinessInDB]:
        """Get all businesses of a user."""
        try:
            # Convert string to PyObjectId for database query
            oid = PyObjectId(user_id)
        except Exception:
            raise ValueError("Invalid user_id format")

        try:
            businesses_data = (
                await self.collection.find({"user_id": oid})
                .skip(skip)
                .limit(limit)
                .to_list(length=limit)
            )
            return [self.db_model.model_validate(business) for business in businesses_data]
        except PyMongoError as e:
            logger.error(f"Database error while fetching businesses: {str(e)}")
            raise RuntimeError("Database error")
        
    async def delete_by_user(
        self, user_id: str
    ) -> bool:
        """Delete all business of user."""
        try:
            # Convert string to PyObjectId for database query
            oid = PyObjectId(user_id)
        except Exception:
            raise ValueError("Invalid user_id or business_id format")

        try:      
            # Delete all businesses associated with the user
            result = await self.collection.delete_many({"user_id": oid})
            logger.info(f"Deleted {result.deleted_count} businesses for user {user_id}")
            return result.deleted_count > 0
        
        except PyMongoError as e:
            logger.error(f"Database error while deleting business: {str(e)}")
            raise RuntimeError("Database error while deleting document")
        
    async def delete(self, business_id: str) -> bool:
        """Delete all data related to a business: sources, jobs, reviews."""
        try:
            oid = PyObjectId(business_id)
        except Exception:
            raise ValueError("Invalid business_id format")

        try:
    
            source_repo = SourceRepository()
            job_repo = JobRepository()
            review_repo = ReviewRepository()

            await source_repo.delete_by_business(oid)
            await job_repo.delete_by_business(oid)
            await review_repo.delete_by_business(oid)
            
            # Finally, delete the business document itself
            result = await self.collection.delete_one({"_id": oid})
            logger.info(f"Deleted all data for business {oid}")
            return result.deleted_count > 0 
        
        except PyMongoError as e:
            logger.error(f"Database error during business deletion: {str(e)}")
            raise RuntimeError("Error while deleting business data")
  
        
    