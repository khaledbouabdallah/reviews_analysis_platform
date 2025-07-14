
from core.config import logger
from db.mongodb import jobs_collection, reviews_collection
from db.repositories.base_repository import BaseRepository
from db.repositories.helpers import ValidatorHelper
from models import PyObjectId
from models.review import ReviewCreate, ReviewInDB, ReviewUpdate
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError, PyMongoError


class ReviewRepository(BaseRepository[ReviewCreate, ReviewUpdate, ReviewInDB]):
    def __init__(self):
        super().__init__(reviews_collection, ReviewInDB)

    async def create(self, review_create: ReviewCreate) -> ReviewInDB:
        try:
            await ValidatorHelper.get_job_or_raise(
                jobs_collection,
                review_create.user_id,
                review_create.business_id,
                review_create.source_id,
                review_create.job_id,
            )

            result = await self.collection.insert_one(
                review_create.model_dump(by_alias=True),
            )

            created_review = await self.collection.find_one({"_id": result.inserted_id})
            if created_review:
                return self.db_model.model_validate(created_review)
            raise RuntimeError("Failed to retrieve created document")

        except DuplicateKeyError:
            raise ValueError("Review with this data already exists")

        except PyMongoError as e:
            logger.error(f"Database error while creating review: {e!s}")
            raise RuntimeError("Database error while creating review")

        except ValueError as e:
            raise ValueError(f"Invalid data: {e!s}")

        except Exception as e:
            logger.error(f"Unexpected error: {e!s}")
            raise RuntimeError(f"Unexpected error: {e!s}")

    async def update(self, review_id: str, review_update: ReviewUpdate) -> ReviewInDB:
        try:
            oid = PyObjectId(review_id)
        except Exception:
            raise ValueError("Invalid review_id format")

        update_data = review_update.model_dump(by_alias=True, exclude_unset=True)

        if not update_data:
            raise ValueError("No fields to update")

        try:
            updated_review = await self.collection.find_one_and_update(
                {"_id": oid},
                {"$set": update_data},
                return_document=ReturnDocument.AFTER,
            )

            if updated_review:
                return self.db_model.model_validate(updated_review)
            raise ValueError("Review not found")
        except PyMongoError as e:
            logger.error(f"Database error while updating review: {e!s}")
            raise RuntimeError("Database error while updating review")

    async def get_by_user(
        self, user_id: str, skip: int = 0, limit: int = 100,
    ) -> list[ReviewInDB]:
        try:
            oid = PyObjectId(user_id)
        except Exception:
            raise ValueError("Invalid user_id format")

        try:
            reviews_data = (
                await self.collection.find({"user_id": oid})
                .skip(skip)
                .to_list(length=limit)
            )
            return [self.db_model.model_validate(review) for review in reviews_data]
        except PyMongoError:
            raise RuntimeError("Database error")

    async def get_by_business(
        self, business_id: str, skip: int = 0, limit: int = 100,
    ) -> list[ReviewInDB]:
        try:
            oid = PyObjectId(business_id)
        except Exception:
            raise ValueError("Invalid business_id format")

        try:
            reviews_data = (
                await self.collection.find({"business_id": oid})
                .skip(skip)
                .to_list(length=limit)
            )
            return [self.db_model.model_validate(review) for review in reviews_data]
        except PyMongoError:
            raise RuntimeError("Database error")

    async def get_by_source(
        self, source_id: str, skip: int = 0, limit: int = 100,
    ) -> list[ReviewInDB]:
        """Get all reviews from a specific source."""
        try:
            oid = PyObjectId(source_id)
        except Exception:
            raise ValueError("Invalid source_id format")

        try:
            reviews_data = (
                await self.collection.find({"source_id": oid})
                .skip(skip)
                .to_list(length=limit)
            )
            return [self.db_model.model_validate(review) for review in reviews_data]
        except PyMongoError as e:
            logger.error(f"Database error while fetching reviews by source: {e!s}")
            raise RuntimeError("Database error")

    async def get_by_job(
        self, job_id: str, skip: int = 0, limit: int = 100,
    ) -> list[ReviewInDB]:
        """Get all reviews linked to a specific scraping job."""
        try:
            oid = PyObjectId(job_id)
        except Exception:
            raise ValueError("Invalid job_id format")

        try:
            reviews_data = (
                await self.collection.find({"job_id": oid})
                .skip(skip)
                .to_list(length=limit)
            )
            return [self.db_model.model_validate(review) for review in reviews_data]
        except PyMongoError as e:
            logger.error(f"Database error while fetching reviews by job: {e!s}")
            raise RuntimeError("Database error")
