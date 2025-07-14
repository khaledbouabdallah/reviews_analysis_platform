from models import PyObjectId
from pymongo.collection import Collection


class ValidatorHelper:
    @staticmethod
    async def get_user_or_raise(users_collection: Collection, user_id: PyObjectId):
        user = await users_collection.find_one({"_id": user_id})
        if not user:
            raise ValueError("User not found")
        return user

    @staticmethod
    async def get_business_or_raise(
        business_collection: Collection, user_id: PyObjectId, business_id: PyObjectId,
    ):
        business = await business_collection.find_one(
            {"_id": business_id, "user_id": user_id},
        )
        if not business:
            raise ValueError("Business not found for this user")
        return business

    @staticmethod
    async def get_source_or_raise(
        source_collection: Collection,
        user_id: PyObjectId,
        business_id: PyObjectId,
        source_id: PyObjectId,
    ):
        source = await source_collection.find_one(
            {"_id": source_id, "user_id": user_id, "business_id": business_id},
        )
        if not source:
            raise ValueError("Source not found for this business and user")
        return source

    @staticmethod
    async def get_job_or_raise(
        job_collection: Collection,
        user_id: PyObjectId,
        business_id: PyObjectId,
        source_id: PyObjectId,
        job_id: PyObjectId,
    ):
        job = await job_collection.find_one(
            {
                "_id": job_id,
                "user_id": user_id,
                "business_id": business_id,
                "source_id": source_id,
                "status": {"$ne": "deleted"},  # Ensure job is not deleted
            },
        )
        if not job:
            raise ValueError("Job not found for this business, source, and user")
        return job
