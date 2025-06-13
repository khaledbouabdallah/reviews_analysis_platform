from pydantic import BaseModel, Field, field_serializer, EmailStr, model_validator
from typing import Optional, Annotated
from models import PyObjectId
from datetime import datetime, timezone


# Base User model with common fields
class UserBase(BaseModel):
    username: Annotated[str, Field(min_length=3, max_length=50)]
    email: Optional[EmailStr] = None
    disabled: bool = False

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {PyObjectId: str, datetime: lambda dt: dt.isoformat()},
    }


# Model for user in database
class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None


# Model for creating a new user
class UserCreate(UserBase):
    password: Annotated[str, Field(min_length=8)]
    email: EmailStr


# Model for updating an existing user
class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=8)
    disabled: Optional[bool] = None

    model_config = {"arbitrary_types_allowed": True}

    @model_validator(mode="after")
    def check_at_least_one_field(self) -> "UserUpdate":
        if all(
            v is None for v in [self.username, self.email, self.password, self.disabled]
        ):
            raise ValueError("At least one field must be provided for update")
        return self


# Response model for API clients
class UserResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    username: str
    email: Optional[EmailStr] = None
    disabled: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}

    @field_serializer("id")
    def serialize_id(self, id: PyObjectId) -> str:
        return str(id)

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, dt: Optional[datetime]) -> Optional[str]:
        if dt:
            return dt.isoformat()
        return None
