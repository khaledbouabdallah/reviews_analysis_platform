# backend/app/api/routers/stats.py
from api.dependencies import get_current_active_user
from core.config import logger
from db.mongodb import busniesses_collection, locations_collection, sources_collection
from fastapi import APIRouter, Depends, HTTPException, status
from models import PyObjectId
from models.stats import BusinessCounts, LocationBasicStats, SourceBasicStats
from models.user import UserInDB

router = APIRouter(prefix="/stats", tags=["statistics"])


@router.get("/businesses/{business_id}", response_model=BusinessCounts)
async def get_business_counts(
    business_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Get simple counts for a specific business."""
    try:
        user_oid = PyObjectId(str(current_user.id))
        business_oid = PyObjectId(business_id)

        # Verify user owns this business and get counts in one query
        pipeline = [
            {"$match": {"_id": business_oid, "user_id": user_oid}},
            {
                "$lookup": {
                    "from": "locations",
                    "localField": "_id",
                    "foreignField": "business_id",
                    "as": "locations",
                }
            },
            {
                "$lookup": {
                    "from": "sources",
                    "localField": "_id",
                    "foreignField": "business_id",
                    "as": "sources",
                }
            },
            {
                "$lookup": {
                    "from": "reviews",
                    "localField": "_id",
                    "foreignField": "business_id",
                    "as": "reviews",
                }
            },
            {
                "$lookup": {
                    "from": "jobs",
                    "localField": "_id",
                    "foreignField": "business_id",
                    "as": "jobs",
                }
            },
            {
                "$project": {
                    "business_id": {"$toString": "$_id"},
                    "business_name": "$name",
                    "location_count": {"$size": "$locations"},
                    "source_count": {"$size": "$sources"},
                    "review_count": {"$size": "$reviews"},
                    "job_count": {"$size": "$jobs"},
                }
            },
        ]

        result = await busniesses_collection.aggregate(pipeline).to_list(1)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found or access denied",
            )

        return BusinessCounts(**result[0])

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting business counts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve business counts",
        )


@router.get("/locations/{location_id}", response_model=LocationBasicStats)
async def get_location_basic_stats(
    location_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Get basic stats for a specific location."""
    try:
        user_oid = PyObjectId(str(current_user.id))
        location_oid = PyObjectId(location_id)

        # Verify user owns this location and get stats in one query
        pipeline = [
            {"$match": {"_id": location_oid, "user_id": user_oid}},
            {
                "$lookup": {
                    "from": "reviews",
                    "localField": "_id",
                    "foreignField": "location_id",
                    "as": "reviews",
                }
            },
            {
                "$lookup": {
                    "from": "jobs",
                    "localField": "_id",
                    "foreignField": "location_id",
                    "as": "jobs",
                }
            },
            {
                "$lookup": {
                    "from": "sources",
                    "localField": "_id",
                    "foreignField": "location_id",
                    "as": "sources",
                }
            },
            {
                "$project": {
                    "location_id": {"$toString": "$_id"},
                    "review_count": {"$size": "$reviews"},
                    "job_count": {"$size": "$jobs"},
                    "source_count": {"$size": "$sources"},
                    "average_rating": {
                        "$avg": "$reviews.rating"
                        if "$reviews.rating" in "$reviews"
                        else 0
                    },
                }
            },
        ]

        result = await locations_collection.aggregate(pipeline).to_list(1)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found or access denied",
            )

        return LocationBasicStats(**result[0])

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting location basic stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve location basic stats",
        )


@router.get("/sources/{source_id}", response_model=SourceBasicStats)
async def get_source_basic_stats(
    source_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Get basic stats for a specific source."""
    try:
        user_oid = PyObjectId(str(current_user.id))
        source_oid = PyObjectId(source_id)

        # Verify user owns this source and get stats in one query
        pipeline = [
            {"$match": {"_id": source_oid, "user_id": user_oid}},
            {
                "$lookup": {
                    "from": "reviews",
                    "localField": "_id",
                    "foreignField": "source_id",
                    "as": "reviews",
                }
            },
            {
                "$lookup": {
                    "from": "jobs",
                    "localField": "_id",
                    "foreignField": "source_id",
                    "as": "jobs",
                }
            },
            {
                "$project": {
                    "source_id": {"$toString": "$_id"},
                    "review_count": {"$size": "$reviews"},
                    "job_count": {"$size": "$jobs"},
                    "average_rating": {
                        "$avg": "$reviews.rating"
                        if "$reviews.rating" in "$reviews"
                        else 0
                    },
                }
            },
        ]

        result = await sources_collection.aggregate(pipeline).to_list(1)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Source not found or access denied",
            )

        return SourceBasicStats(**result[0])

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting source basic stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve source basic stats",
        )
