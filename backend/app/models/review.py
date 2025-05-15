from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from pydantic import BaseModel, Field, field_serializer, ConfigDict
from models import PyObjectId


class User(BaseModel):
    username: str
    email: Optional[str] = None
    disabled: Optional[bool] = False
    
    
class UserInDB(User):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    
class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: str
    
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    disabled: Optional[bool] = None
    
class UserResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    
    # Replace model_config with model_config class variable
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }
    
    # Replace json_encoders with field_serializer
    @field_serializer('id')
    def serialize_id(self, id: PyObjectId) -> str:
        return str(id)