from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings

# Create client connection (this is executed on import)
client = AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.MONGODB_DB_NAME]

users_collection = db['users']
busniesses_collection = db['busniesses']
sources_collection = db['sources']
jobs_collection = db['jobs']
reviews_collection = db['reviews']


async def init_indexes():
    # Businesses: ensure (user_id, name) is unique
    await busniesses_collection.create_index(
        [("user_id", 1), ("name", 1)],
        unique=True,
        name="user_name_unique_idx"
    )

    # Sources: ensure (user_id, business_id, name) is unique
    await sources_collection.create_index(
        [("user_id", 1), ("business_id", 1), ("name", 1)],
        unique=True,
        name="user_business_source_name_unique_idx"
    )

    # Jobs: ensure (user_id, business_id, source_id, name) is unique
    await jobs_collection.create_index(
        [("user_id", 1), ("business_id", 1), ("source_id", 1), ("name", 1)],
        unique=True,
        name="user_business_source_job_name_unique_idx"
    )
    

    # Reviews: ensure (user_id, business_id, source_id,job_id, external_review_id) is unique
    await reviews_collection.create_index(
        [("user_id", 1), ("business_id", 1), ("source_id", 1), ("job_id", 1), ("external_review_id", 1)],
        unique=True,
        name="user_business_source_job_review_unique_idx"
    )

    # Optional fast retrievals:
    await reviews_collection.create_index(
        [("source_id", 1)],
        name="source_reviews_idx"
    )
    await jobs_collection.create_index(
        [("source_id", 1)],
        name="source_jobs_idx"
    )