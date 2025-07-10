from db.repositories.base_repository import BaseRepository
from db.mongodb import (
    sources_collection,
    users_collection,
    busniesses_collection,
    jobs_collection,
)
from db.repositories.reviews import ReviewRepository
from models.job import JobCreate, JobUpdate, JobInDB, JobUpdateInternal
from models import PyObjectId
from pymongo import ReturnDocument
from pymongo.errors import PyMongoError, DuplicateKeyError
from typing import List, Optional
from db.repositories.helpers import ValidatorHelper
from core.config import logger


class JobRepository(BaseRepository[JobCreate, JobUpdate, JobInDB]):
    def __init__(self):
        super().__init__(jobs_collection, JobInDB)

    async def create(self, job_create: JobCreate) -> JobInDB:
        try:

            await ValidatorHelper.get_source_or_raise(
                sources_collection,
                job_create.user_id,
                job_create.business_id,
                job_create.source_id,
            )

            # Insert Job
            result = await self.collection.insert_one(
                job_create.model_dump(by_alias=True)
            )

            created_job = await self.collection.find_one({"_id": result.inserted_id})
            if created_job:
                return self.db_model.model_validate(created_job)
            raise RuntimeError("Failed to retrieve created document")

        except DuplicateKeyError:
            raise ValueError("Job with this name already exists")

        except PyMongoError as e:
            logger.error(f"Database error while creating job: {str(e)}")
            raise RuntimeError("Database error while creating job")

        except ValueError as e:
            raise ValueError(f"Invalid data: {str(e)}")

        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            raise RuntimeError(f"Unexpected error: {str(e)}")

    async def update_internal(
        self, job_id: str, job_update: JobUpdateInternal
    ) -> JobInDB:
        """Update job with internal fields."""
        try:
            oid = PyObjectId(job_id)
        except Exception:
            raise ValueError("Invalid job_id format")

        update_data = job_update.model_dump(by_alias=True, exclude_unset=True)

        if not update_data:
            raise ValueError("No fields to update")

        try:
            updated_job = await self.collection.find_one_and_update(
                {"_id": oid},
                {"$set": update_data},
                return_document=ReturnDocument.AFTER,
            )

            if updated_job:
                return self.db_model.model_validate(updated_job)
            else:
                raise ValueError("Job not found")
        except PyMongoError as e:
            logger.error(f"Database error while updating job: {str(e)}")
            raise RuntimeError("Database error while updating job")

    async def get_by_user(
        self, user_id: str, skip: int = 0, limit: int = 100
    ) -> List[JobInDB]:
        """Get all jobs of a user."""
        try:
            oid = PyObjectId(user_id)
        except Exception:
            raise ValueError("Invalid user_id format")

        try:
            jobs_data = (
                await self.collection.find({"user_id": oid})
                .skip(skip)
                .to_list(length=limit)
            )
            return [self.db_model.model_validate(job) for job in jobs_data]
        except PyMongoError as e:
            raise RuntimeError("Database error")

    async def get_by_business(
        self, business_id: str, skip: int = 0, limit: int = 100
    ) -> List[JobInDB]:
        """Get all jobs of a business."""
        try:
            oid = PyObjectId(business_id)
        except Exception:
            raise ValueError("Invalid user_id format")

        try:
            jobs_data = (
                await self.collection.find({"business_id": oid})
                .skip(skip)
                .to_list(length=limit)
            )
            return [self.db_model.model_validate(job) for job in jobs_data]
        except PyMongoError as e:
            raise RuntimeError("Database error")
        
    async def delete_by_user(
        self, user_id: str
    ) -> bool:
        """Delete all jobs of a user."""
        try:
            # Convert string to PyObjectId for database query
            oid = PyObjectId(user_id)
        except Exception:
            raise ValueError("Invalid user_id format")

        try:
            result = await self.collection.delete_many({"user_id": oid})
            logger.info(f"Deleted {result.deleted_count} jobs for user {oid}")
            return result.deleted_count > 0

        except PyMongoError as e:
            logger.error(f"Database error while deleting jobs: {str(e)}")
            raise RuntimeError("Database error while deleting jobs") 
        
        
    async def delete_by_business(
        self, business_id: str
    ) -> bool:
        """Delete all sources of business."""
        try:
            # Convert string to PyObjectId for database query
            oid = PyObjectId(business_id)
        except Exception:
            raise ValueError("Invalid user_id or business_id format")

        try:
            result = await self.collection.delete_many({"business_id": oid})
            logger.info(f"Deleted {result.deleted_count} sources for business {oid}")
            return result.deleted_count > 0
        
        except PyMongoError as e:
            logger.error(f"Database error while deleting sources: {str(e)}")
            raise RuntimeError("Database error while deleting sources")

 
    async def delete_by_source(
        self, source_id: str
    ) -> bool:
        """Delete all jobs of a source."""
        try:
            # Convert string to PyObjectId for database query
            oid = PyObjectId(source_id)
        except Exception:
            raise ValueError("Invalid user_id or source_id format")

        try:
            result = await self.collection.delete_many({"source_id": oid})
            logger.info(f"Deleted {result.deleted_count} jobs for source {oid}")
            return result.deleted_count > 0
        
        except PyMongoError as e:
            logger.error(f"Database error while deleting jobs: {str(e)}")
            raise RuntimeError("Database error while deleting jobs")
        
    async def delete(self, source_id: str) -> bool:
        """Delete all data related to a job:jobs, reviews."""
        try:
            oid = PyObjectId(source_id)
        except Exception:
            raise ValueError("Invalid source_id format")

        try:
    
            
            review_repo = ReviewRepository()
            await review_repo.delete_by_source(oid)
            
            # Finally, delete the job document itself
            result = await self.collection.delete_one({"_id": oid})
            logger.info(f"Deleted all data for job {oid}")
            return result.deleted_count > 0 
        
        except PyMongoError as e:
            logger.error(f"Database error during job deletion: {str(e)}")
            raise RuntimeError("Error while deleting job data")

