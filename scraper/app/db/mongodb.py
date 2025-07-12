from core.config import settings
from motor.motor_asyncio import AsyncIOMotorClient

# Create client connection (this is executed on import)
client = AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.MONGODB_DB_NAME]

users_collection = db["users"]
reviews_collection = db["reviews"]
sources_collection = db["sources"]
jobs_collection = db["jobs"]
