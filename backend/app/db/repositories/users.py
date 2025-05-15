from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from bson import ObjectId
from db.mongodb import users_collection
from models.user import UserCreate, UserInDB, UserUpdate, UserResponse
from core.security import get_password_hash
from pymongo import ReturnDocument
from core.config import logger

class UserRepository:
    """Repository for user operations in MongoDB."""
    
    async def get_by_username(self, username: str) -> Optional[UserInDB]:
        """Get a user by username."""
        user_data = await users_collection.find_one({"username": username})
        logger.info(f"get_by_username: {user_data}, {bool(user_data)}")
     
        if user_data:
            return UserInDB.model_validate(user_data)
        return None
    
    async def get_by_email(self, email: str) -> Optional[UserInDB]:
        """Get a user by email."""
        user_data = await users_collection.find_one({"email": email})
        if user_data:
            return UserInDB.model_validate(user_data)
        return None
    
    async def get_by_id(self, user_id: str) -> Optional[UserInDB]:
        """Get a user by ID."""
        try:
            user_data = await users_collection.find_one({"_id": ObjectId(user_id)})
            if user_data:
                return UserInDB.model_validate(user_data)
            return None
        except:
            return None
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[UserInDB]:
        """Get all users with pagination."""
        users_data = await users_collection.find().skip(skip).limit(limit).to_list(length=limit)
        return [UserInDB.model_validate(user) for user in users_data]
    
    async def create(self, user: UserCreate) -> UserInDB:
        """Create a new user."""
        user_dict = user.model_dump(exclude={"password"})
        user_dict["hashed_password"] = get_password_hash(user.password)
        user_dict["created_at"] = datetime.now(timezone.utc)
        user_dict["updated_at"] = datetime.now(timezone.utc)
        

        logger.info(f"Creating user: {user_dict}")
        
        result = await users_collection.insert_one(user_dict)
        logger.info(f"User created with ID: {result.inserted_id}")
        user_dict["_id"] = result.inserted_id
        
        
        
        return UserInDB.model_validate(user_dict)
    
    async def update(self, user_id: str, update_data: UserUpdate) -> UserInDB | None:
        """Update a user and return the updated document."""
        try:
            oid = ObjectId(user_id)
        except Exception:
            return None

        # Handle password updates securely
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        updated_user = await users_collection.find_one_and_update(
            {"_id": oid},
            {"$set": update_data},
            return_document=ReturnDocument.AFTER
        )

        if updated_user:
            return UserInDB.model_validate(updated_user)
        return None
    
    async def delete(self, user_id: str) -> bool:
        """Delete a user."""
        try:
            result = await users_collection.delete_one({"_id": ObjectId(user_id)})
            return result.deleted_count > 0
        except:
            return False