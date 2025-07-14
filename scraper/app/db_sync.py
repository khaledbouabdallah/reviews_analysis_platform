import logging
import os
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from pymongo import MongoClient

logger = logging.getLogger(__name__)

# MongoDB connection
MONGODB_URL = os.getenv(
    "MONGODB_URL_SYNC", "mongodb://admin:password@mongodb:27017/?authSource=admin",
)
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "mydatabase")


class SyncDatabase:
    """Synchronous database operations for Celery workers"""

    def __init__(self):
        self.client = MongoClient(MONGODB_URL)
        self.db = self.client[MONGODB_DB_NAME]
        self.jobs_collection = self.db["jobs"]
        self.reviews_collection = self.db["reviews"]

    def update_job_status(
        self,
        job_id: str,
        status: str,
        error: str | None = None,
        total_reviews: int | None = None,
        reviews_scraped: int | None = None,
        started_at: datetime | None = None,
        ended_at: datetime | None = None,
    ) -> bool:
        """Update job status and metadata"""
        try:
            # Build update document
            update_data = {"status": status}

            if error is not None:
                update_data["error"] = error
            if total_reviews is not None:
                update_data["total_reviews"] = total_reviews
            if reviews_scraped is not None:
                update_data["reviews_scraped"] = reviews_scraped
            if started_at is not None:
                update_data["started_at"] = started_at
            if ended_at is not None:
                update_data["ended_at"] = ended_at

            # Update in MongoDB
            result = self.jobs_collection.update_one(
                {"_id": ObjectId(job_id)}, {"$set": update_data},
            )

            if result.matched_count > 0:
                logger.info(f"Updated job {job_id} status to {status}")
                return True
            logger.warning(f"Job {job_id} not found for status update")
            return False

        except Exception as e:
            logger.error(f"Failed to update job {job_id} status: {e}")
            return False

    def create_review(
        self,
        job_id: str,
        user_id: str,
        business_id: str,
        source_id: str,
        source_type: str,
        review_data: dict[str, Any],
    ) -> bool:
        """Create a single review"""
        try:
            review_doc = {
                "user_id": ObjectId(user_id),
                "business_id": ObjectId(business_id),
                "source_id": ObjectId(source_id),
                "job_id": ObjectId(job_id),
                "data": review_data,
                "source_type": source_type,
                "created_at": datetime.now(timezone.utc),
            }

            result = self.reviews_collection.insert_one(review_doc)
            return result.inserted_id is not None

        except Exception as e:
            logger.error(f"Failed to create review for job {job_id}: {e}")
            return False

    def create_reviews_batch(
        self,
        job_id: str,
        user_id: str,
        business_id: str,
        source_id: str,
        source_type: str,
        reviews_data: list[dict[str, Any]],
        batch_size: int = 50,
    ) -> int:
        """Create reviews in batches for better performance"""
        saved_count = 0

        try:
            # Process in batches
            for i in range(0, len(reviews_data), batch_size):
                batch = reviews_data[i : i + batch_size]

                # Prepare batch documents
                review_docs = []
                for review_data in batch:
                    review_doc = {
                        "user_id": ObjectId(user_id),
                        "business_id": ObjectId(business_id),
                        "source_id": ObjectId(source_id),
                        "job_id": ObjectId(job_id),
                        "data": review_data,
                        "source_type": source_type,
                        "created_at": datetime.now(timezone.utc),
                    }
                    review_docs.append(review_doc)

                # Insert batch
                result = self.reviews_collection.insert_many(review_docs)
                batch_saved = len(result.inserted_ids)
                saved_count += batch_saved

                logger.info(f"Saved batch {i // batch_size + 1}: {batch_saved} reviews")

        except Exception as e:
            logger.error(f"Failed to save reviews batch for job {job_id}: {e}")

        return saved_count

    def close(self):
        """Close database connection"""
        if hasattr(self, "client"):
            self.client.close()


# Global sync database instance
sync_db = SyncDatabase()
