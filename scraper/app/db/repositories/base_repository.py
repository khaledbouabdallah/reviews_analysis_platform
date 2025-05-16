from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.errors import PyMongoError
from typing import Generic, List, Optional, TypeVar, Type

# Typing generics for reuse
CreateSchema = TypeVar("CreateSchema")
UpdateSchema = TypeVar("UpdateSchema")
DBSchema = TypeVar("DBSchema")


class BaseRepository(Generic[CreateSchema, UpdateSchema, DBSchema]):
    def __init__(self, collection, db_model: Type[DBSchema]):
        self.collection = collection
        self.db_model = db_model

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[DBSchema]:
        try:
            items = await self.collection.find().skip(skip).limit(limit).to_list(length=limit)
            return [self.db_model.model_validate(item) for item in items]
        except PyMongoError as e:
            raise RuntimeError("Database error while fetching documents")

    async def get_by_id(self, item_id: str) -> Optional[DBSchema]:
        try:
            oid = ObjectId(item_id)
        except Exception:
            raise ValueError("Invalid ID format")

        try:
            item = await self.collection.find_one({"_id": oid})
            if item:
                return self.db_model.model_validate(item)
            return None
        except PyMongoError as e:
            raise RuntimeError("Database error while fetching document by ID")

    async def create(self, data: CreateSchema) -> DBSchema:
        try:
            data_dict = data.dict()
            result = await self.collection.insert_one(data_dict)
            created_item = await self.collection.find_one({"_id": result.inserted_id})
            if created_item:
                return self.db_model.model_validate(created_item)
            raise RuntimeError("Failed to retrieve created document")
        except PyMongoError as e:
            raise RuntimeError("Database error while creating document")

    async def update(self, item_id: str, update_data: UpdateSchema) -> Optional[DBSchema]:
        try:
            oid = ObjectId(item_id)
        except Exception:
            raise ValueError("Invalid ID format")

        try:
            updated_item = await self.collection.find_one_and_update(
                {"_id": oid},
                {"$set": update_data.dict(exclude_unset=True)},
                return_document=ReturnDocument.AFTER
            )
            if updated_item:
                return self.db_model.model_validate(updated_item)
            return None
        except PyMongoError as e:
            raise RuntimeError("Database error while updating document")

    async def delete(self, item_id: str) -> bool:
        try:
            oid = ObjectId(item_id)
        except Exception:
            raise ValueError("Invalid ID format")

        try:
            result = await self.collection.delete_one({"_id": oid})
            return result.deleted_count == 1
        except PyMongoError as e:
            raise RuntimeError("Database error while deleting document")