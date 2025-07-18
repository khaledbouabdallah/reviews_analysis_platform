from core.config import logger
from db.mongodb import reviews_collection, sources_collection
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
            await ValidatorHelper.get_source_or_raise(
                sources_collection,
                review_create.user_id,
                review_create.business_id,
                review_create.source_id,
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

    async def get_by_user(self, user_id: str, skip: int = 0) -> list[ReviewInDB]:
        try:
            oid = PyObjectId(user_id)
        except Exception:
            raise ValueError("Invalid user_id format")

        try:
            reviews_data = (
                await self.collection.find({"user_id": oid}).skip(skip).to_list()
            )
            return [self.db_model.model_validate(review) for review in reviews_data]
        except PyMongoError:
            raise RuntimeError("Database error")

    async def get_by_business(
        self,
        business_id: str,
        skip: int = 0,
    ) -> list[ReviewInDB]:
        try:
            oid = PyObjectId(business_id)
        except Exception:
            raise ValueError("Invalid business_id format")

        try:
            reviews_data = (
                await self.collection.find({"business_id": oid}).skip(skip).to_list()
            )
            return [self.db_model.model_validate(review) for review in reviews_data]
        except PyMongoError:
            raise RuntimeError("Database error")

    async def get_by_source(self, source_id: str, skip: int = 0) -> list[ReviewInDB]:
        """Get all reviews from a specific source."""
        try:
            oid = PyObjectId(source_id)
        except Exception:
            raise ValueError("Invalid source_id format")

        try:
            reviews_data = (
                await self.collection.find({"source_id": oid}).skip(skip).to_list()
            )
            return [self.db_model.model_validate(review) for review in reviews_data]
        except PyMongoError as e:
            logger.error(f"Database error while fetching reviews by source: {e!s}")
            raise RuntimeError("Database error")

    async def get_by_location(
        self,
        location_id: str,
        skip: int = 0,
    ) -> list[ReviewInDB]:
        """Get all reviews from a specific location."""
        try:
            oid = PyObjectId(location_id)
        except Exception:
            raise ValueError("Invalid location_id format")

        try:
            reviews_data = (
                await self.collection.find({"location_id": oid}).skip(skip).to_list()
            )
            return [self.db_model.model_validate(review) for review in reviews_data]
        except PyMongoError as e:
            logger.error(f"Database error while fetching reviews by location: {e!s}")
            raise RuntimeError("Database error")

    async def get_by_job(self, job_id: str, skip: int = 0) -> list[ReviewInDB]:
        """Get all reviews linked to a specific scraping job."""
        try:
            oid = PyObjectId(job_id)
        except Exception:
            raise ValueError("Invalid job_id format")

        try:
            reviews_data = (
                await self.collection.find({"job_id": oid}).skip(skip).to_list()
            )
            return [self.db_model.model_validate(review) for review in reviews_data]
        except PyMongoError as e:
            logger.error(f"Database error while fetching reviews by job: {e!s}")
            raise RuntimeError("Database error")

    async def update_processed_data(
        self,
        review_id: str,
        analyzed_data: dict,
    ) -> ReviewInDB:
        """Update the processed data of a review."""
        try:
            oid = PyObjectId(review_id)
        except Exception:
            raise ValueError("Invalid review_id format")

        update_data = {"analyzed_data": analyzed_data}

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
            logger.error(f"Database error while updating processed data: {e!s}")
            raise RuntimeError("Database error while updating processed data")

    async def delete_by_user(self, user_id: str) -> bool:
        """Delete all reviews of a user."""
        try:
            oid = PyObjectId(user_id)
        except Exception:
            raise ValueError("Invalid user_id format")

        try:
            result = await self.collection.delete_many({"user_id": oid})
            logger.info(f"Deleted {result.deleted_count} reviews for user {user_id}")
            return result.deleted_count > 0
        except PyMongoError as e:
            logger.error(f"Database error while deleting reviews: {e!s}")
            raise RuntimeError("Database error while deleting reviews")

    async def delete_by_business(self, business_id: str) -> bool:
        """Delete all reviews of a business."""
        try:
            oid = PyObjectId(business_id)
        except Exception:
            raise ValueError("Invalid business_id format")

        try:
            result = await self.collection.delete_many({"business_id": oid})
            logger.info(
                f"Deleted {result.deleted_count} reviews for business {business_id}",
            )
            return result.deleted_count > 0
        except PyMongoError as e:
            logger.error(f"Database error while deleting reviews: {e!s}")
            raise RuntimeError("Database error while deleting reviews")

    async def delete_by_location(self, location_id: str) -> bool:
        """Delete all sources of location."""
        try:
            # Convert string to PyObjectId for database query
            oid = PyObjectId(location_id)
        except Exception:
            raise ValueError("Invalid user_id or location_id format")

        try:
            result = await self.collection.delete_many({"location_id": oid})
            logger.info(f"Deleted {result.deleted_count} sources for location {oid}")
            return result.deleted_count > 0

        except PyMongoError as e:
            logger.error(f"Database error while deleting sources: {e!s}")
            raise RuntimeError("Database error while deleting sources")

    async def delete_by_source(self, source_id: str) -> bool:
        """Delete all reviews of a source."""
        try:
            oid = PyObjectId(source_id)
        except Exception:
            raise ValueError("Invalid source_id format")

        try:
            result = await self.collection.delete_many({"source_id": oid})
            logger.info(
                f"Deleted {result.deleted_count} reviews for source {source_id}",
            )
            return result.deleted_count > 0
        except PyMongoError as e:
            logger.error(f"Database error while deleting reviews by source: {e!s}")
            raise RuntimeError("Database error while deleting reviews by source")

    async def delete_by_job(self, job_id: str) -> None:
        """Delete all jobs of a source."""
        try:
            # Convert string to PyObjectId for database query
            oid = PyObjectId(job_id)
        except Exception:
            raise ValueError("Invalid job_id format")

        try:
            result = await self.collection.delete_many({"job_id": oid})
            logger.info(f"Deleted {result.deleted_count} reviews for job {job_id}")
            return

        except PyMongoError as e:
            logger.error(f"Database error while deleting reviews by job: {e!s}")
            raise RuntimeError("Database error while deleting reviews by job")

    async def delete(self, review_id: str) -> bool:
        """Delete a specific review."""
        try:
            oid = PyObjectId(review_id)
        except Exception:
            raise ValueError("Invalid review_id format")

        try:
            result = await self.collection.delete_one({"_id": oid})
            logger.info(f"Deleted review {review_id}")
            return result.deleted_count > 0
        except PyMongoError as e:
            logger.error(f"Database error while deleting review: {e!s}")
            raise RuntimeError("Database error while deleting review")
