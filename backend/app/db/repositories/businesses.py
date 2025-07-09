# backend/app/db/repositories/businesses.py (CLEAN VERSION)
from db.repositories.base_repository import BaseRepository
from db.mongodb import busniesses_collection, users_collection
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