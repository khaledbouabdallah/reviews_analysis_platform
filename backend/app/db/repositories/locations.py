from core.config import logger
from db.mongodb import busniesses_collection, locations_collection, users_collection
from db.repositories.base_repository import BaseRepository
from db.repositories.helpers import ValidatorHelper
from db.repositories.jobs import JobRepository
from db.repositories.reviews import ReviewRepository
from db.repositories.sources import SourceRepository
from models import PyObjectId
from models.location import LocationCreate, LocationInDB, LocationUpdate
from pymongo.errors import DuplicateKeyError, PyMongoError


class LocationRepository(BaseRepository[LocationCreate, LocationUpdate, LocationInDB]):
    def __init__(self):
        super().__init__(locations_collection, LocationInDB)

    async def create(self, location_create: LocationCreate) -> LocationInDB:
        try:
            await ValidatorHelper.get_user_or_raise(
                users_collection, location_create.user_id,
            )
            await ValidatorHelper.get_business_or_raise(
                busniesses_collection,
                location_create.user_id,
                location_create.business_id,
            )

            # Insert business
            result = await self.collection.insert_one(
                location_create.model_dump(by_alias=True),
            )

            created_business = await self.collection.find_one(
                {"_id": result.inserted_id},
            )
            if created_business:
                return self.db_model.model_validate(created_business)
            raise RuntimeError("Failed to retrieve created location")

        except DuplicateKeyError:
            raise ValueError("location with this name already exists")

        except PyMongoError as e:
            logger.error(f"Database error while creating business: {e!s}")
            raise RuntimeError("Database error while creating location")

        except ValueError as e:
            raise ValueError(f"Invalid location data: {e!s}")

        except Exception as e:
            logger.error(f"Unexpected error when creating location: {e!s}")
            raise RuntimeError(f"Unexpected error when creating location {e!s}")

    async def get_by_user(
        self, user_id: str, skip: int = 0, limit: int = 100,
    ) -> list[LocationInDB]:
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
            raise RuntimeError("Database error while fetching locations by user")

    async def get_by_business(
        self, business_id: str, skip: int = 0, limit: int = 100,
    ) -> list[LocationInDB]:
        """Get all locations of a business."""
        try:
            oid = PyObjectId(business_id)
        except Exception:
            raise ValueError("Invalid business_id format")

        try:
            jobs_data = (
                await self.collection.find({"business_id": oid})
                .skip(skip)
                .to_list(length=limit)
            )
            return [self.db_model.model_validate(job) for job in jobs_data]
        except PyMongoError:
            raise RuntimeError("Database error while fetching locations by business")

    async def delete_by_business(self, business_id: str) -> bool:
        """Delete all locations of business."""
        try:
            # Convert string to PyObjectId for database query
            oid = PyObjectId(business_id)
        except Exception:
            raise ValueError("Invalid user_id or business_id format")

        try:
            result = await self.collection.delete_many({"business_id": oid})
            logger.info(f"Deleted {result.deleted_count} locations for business {oid}")
            return result.deleted_count > 0

        except PyMongoError as e:
            logger.error(f"Database error while deleting locations: {e!s}")
            raise RuntimeError("Database error while deleting locations")

    async def delete_by_user(self, user_id: str) -> bool:
        """Delete all locations of a user."""
        try:
            # Convert string to PyObjectId for database query
            oid = PyObjectId(user_id)
        except Exception:
            raise ValueError("Invalid user_id format")

        try:
            result = await self.collection.delete_many({"user_id": oid})
            logger.info(f"Deleted {result.deleted_count} locations for user {oid}")
            return result.deleted_count > 0

        except PyMongoError as e:
            logger.error(f"Database error while deleting locations: {e!s}")
            raise RuntimeError("Database error while deleting locations")

    async def delete(self, source_id: str) -> bool:
        """Delete all data related to a source:jobs, reviews."""
        try:
            oid = PyObjectId(source_id)
        except Exception:
            raise ValueError("Invalid source_id format")

        try:
            source_repo = SourceRepository()
            job_repo = JobRepository()
            review_repo = ReviewRepository()

            await source_repo.delete_by_location(oid)
            await job_repo.delete_bylocation(oid)
            await review_repo.delete_by_location(oid)

            # Finally, delete the source document itself
            result = await self.collection.delete_one({"_id": oid})
            logger.info(f"Deleted all data for source {oid}")
            return result.deleted_count > 0

        except PyMongoError as e:
            logger.error(f"Database error during source deletion: {e!s}")
            raise RuntimeError("Error while deleting source data")
