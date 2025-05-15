from pydantic import BaseModel
from typing import Optional
from pydantic import BaseModel, Field, field_serializer, HttpUrl
from models import PyObjectId
from datetime import datetime


class Site(BaseModel):
    name: str
    url: HttpUrl
    description: Optional[str] = None
    user_id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = None
    

class SiteInDB(Site):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.now)
    last_updated_at: datetime = None
    description: Optional[str] = None
    user_id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    
class SiteCreate(BaseModel):
    name: str
    url: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = None
    description: Optional[str] = None
    user_id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    
    
class SiteUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    last_updated_at: Optional[datetime] = None
    description: Optional[str] = None
    
class SiteResponse(BaseModel):
    id : PyObjectId = Field(alias="_id")
    name: str
    url: str
    created_at: datetime
    last_updated_at: datetime
    description: Optional[str] = None
    user_id: PyObjectId = Field(alias="_user_id")
    
    
    