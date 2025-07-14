
from core.config import logger
from db.mongodb import jobs_collection, sources_collection
from db.repositories.base_repository import BaseRepository
from db.repositories.helpers import ValidatorHelper
from models import PyObjectId
from models.job import JobCreate, JobInDB, JobUpdate, JobUpdateInternal
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError, PyMongoError


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
                job_create.model_dump(by_alias=True),
            )

            created_job = await self.collection.find_one({"_id": result.inserted_id})
            if created_job:
                return self.db_model.model_validate(created_job)
            raise RuntimeError("Failed to retrieve created document")

        except DuplicateKeyError:
            raise ValueError("Job with this name already exists")

        except PyMongoError as e:
            logger.error(f"Database error while creating job: {e!s}")
            raise RuntimeError("Database error while creating job")

        except ValueError as e:
            raise ValueError(f"Invalid data: {e!s}")

        except Exception as e:
            logger.error(f"Unexpected error: {e!s}")
            raise RuntimeError(f"Unexpected error: {e!s}")

    async def update_internal(
        self, job_id: str, job_update: JobUpdateInternal,
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
            raise ValueError("Job not found")
        except PyMongoError as e:
            logger.error(f"Database error while updating job: {e!s}")
            raise RuntimeError("Database error while updating job")

    async def get_by_user(
        self, user_id: str, skip: int = 0, limit: int = 100,
    ) -> list[JobInDB]:
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
        except PyMongoError:
            raise RuntimeError("Database error")

    async def get_by_business(
        self, business_id: str, skip: int = 0, limit: int = 100,
    ) -> list[JobInDB]:
        """Get all jobs of a business."""
        try:
            oid = PyObjectId(business_id)
        except Exception:
            raise ValueError("Invalid user_id format")

        try:
            jobs_data = (
                await self.collection.find({"user_id": oid})
                .skip(skip)
                .to_list(length=limit)
            )
            return [self.db_model.model_validate(job) for job in jobs_data]
        except PyMongoError:
            raise RuntimeError("Database error")
