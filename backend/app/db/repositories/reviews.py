from db.repositories.base_repository import BaseRepository
from db.mongodb import (
    sources_collection,
    users_collection,
    busniesses_collection,
    reviews_collection,
)
from models.review import ReviewCreate, ReviewUpdate, ReviewInDB
from models import PyObjectId
from pymongo import ReturnDocument
from pymongo.errors import PyMongoError, DuplicateKeyError
from typing import List
from db.repositories.helpers import ValidatorHelper
from core.config import logger


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
                review_create.model_dump(by_alias=True)
            )

            created_review = await self.collection.find_one({"_id": result.inserted_id})
            if created_review:
                return self.db_model.model_validate(created_review)
            raise RuntimeError("Failed to retrieve created document")

        except DuplicateKeyError:
            raise ValueError("Review with this data already exists")

        except PyMongoError as e:
            logger.error(f"Database error while creating review: {str(e)}")
            raise RuntimeError("Database error while creating review")

        except ValueError as e:
            raise ValueError(f"Invalid data: {str(e)}")

        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            raise RuntimeError(f"Unexpected error: {str(e)}")

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
            else:
                raise ValueError("Review not found")
        except PyMongoError as e:
            logger.error(f"Database error while updating review: {str(e)}")
            raise RuntimeError("Database error while updating review")

    async def get_by_user(self, user_id: str, skip: int = 0) -> List[ReviewInDB]:
        try:
            oid = PyObjectId(user_id)
        except Exception:
            raise ValueError("Invalid user_id format")

        try:
            reviews_data = (
                await self.collection.find({"user_id": oid}).skip(skip).to_list()
            )
            return [self.db_model.model_validate(review) for review in reviews_data]
        except PyMongoError as e:
            raise RuntimeError("Database error")

    async def get_by_business(
        self, business_id: str, skip: int = 0
    ) -> List[ReviewInDB]:
        try:
            oid = PyObjectId(business_id)
        except Exception:
            raise ValueError("Invalid business_id format")

        try:
            reviews_data = (
                await self.collection.find({"business_id": oid}).skip(skip).to_list()
            )
            return [self.db_model.model_validate(review) for review in reviews_data]
        except PyMongoError as e:
            raise RuntimeError("Database error")

    async def get_by_source(self, source_id: str, skip: int = 0) -> List[ReviewInDB]:
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
            logger.error(f"Database error while fetching reviews by source: {str(e)}")
            raise RuntimeError("Database error")

    async def get_by_job(self, job_id: str, skip: int = 0) -> List[ReviewInDB]:
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
            logger.error(f"Database error while fetching reviews by job: {str(e)}")
            raise RuntimeError("Database error")

    async def update_processed_data(
        self, review_id: str, processed_data: dict
    ) -> ReviewInDB:
        """Update the processed data of a review."""
        try:
            oid = PyObjectId(review_id)
        except Exception:
            raise ValueError("Invalid review_id format")

        update_data = {"processed_data": processed_data}

        try:
            updated_review = await self.collection.find_one_and_update(
                {"_id": oid},
                {"$set": update_data},
                return_document=ReturnDocument.AFTER,
            )

            if updated_review:
                return self.db_model.model_validate(updated_review)
            else:
                raise ValueError("Review not found")
        except PyMongoError as e:
            logger.error(f"Database error while updating processed data: {str(e)}")
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
            logger.error(f"Database error while deleting reviews: {str(e)}")
            raise RuntimeError("Database error while deleting reviews")

    async def delete_by_business(self, business_id: str) -> bool:
        """Delete all reviews of a business."""
        try:
            oid = PyObjectId(business_id)
        except Exception:
            raise ValueError("Invalid business_id format")

        try:
            result = await self.collection.delete_many({"business_id": oid})
            logger.info(f"Deleted {result.deleted_count} reviews for business {business_id}")
            return result.deleted_count > 0
        except PyMongoError as e:
            logger.error(f"Database error while deleting reviews: {str(e)}")
            raise RuntimeError("Database error while deleting reviews")
        
    async def delete_by_source(self, source_id: str) -> bool:
        """Delete all reviews of a source."""
        try:
            oid = PyObjectId(source_id)
        except Exception:
            raise ValueError("Invalid source_id format")

        try:
            result = await self.collection.delete_many({"source_id": oid})
            logger.info(f"Deleted {result.deleted_count} reviews for source {source_id}")
            return result.deleted_count > 0
        except PyMongoError as e:
            logger.error(f"Database error while deleting reviews by source: {str(e)}")
            raise RuntimeError("Database error while deleting reviews by source")
        
    
        
    async def delete_by_job(
        self, source_id: str
    ) -> None:
        """Delete all jobs of a source."""
        try:
            # Convert string to PyObjectId for database query
            oid = PyObjectId(source_id)
        except Exception:
            raise ValueError("Invalid user_id or source_id format")

        try:
            result = await self.collection.delete_many({"source_id": oid})
            logger.info(f"Deleted {result.deleted_count} jobs for source {source_id}")
            return None
        
        except PyMongoError as e:
            logger.error(f"Database error while deleting jobs: {str(e)}")
            raise RuntimeError("Database error while deleting jobs")
        
        
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
            logger.error(f"Database error while deleting review: {str(e)}")
            raise RuntimeError("Database error while deleting review")
