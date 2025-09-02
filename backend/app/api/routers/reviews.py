# backend/app/api/routers/reviews.py (BUSINESS-CENTRIC VERSION)

from typing import Optional
from api.dependencies import get_current_active_user
from core.config import logger
from db.repositories import ReviewRepository
from fastapi import APIRouter, Depends, HTTPException, Query, status
from models.review import ReviewResponse, ReviewUpdate
from models.user import UserInDB
from pydantic import BaseModel

router = APIRouter(prefix="/reviews", tags=["reviews"])
review_repo = ReviewRepository()


class PaginatedReviewResponse(BaseModel):
    reviews: list[ReviewResponse]
    total: int
    page: int
    pages: int


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(
    review_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Get a review by ID (only if user owns it)."""
    try:
        logger.info("Getting review by ID endpoint")
        review = await review_repo.get_by_id(review_id)
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        # Check if user owns this review
        if review.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this review",
            )

        return ReviewResponse.model_validate(review.model_dump(by_alias=False))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve review {review_id}: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve review: {e!s}")


@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: str,
    review_data: ReviewUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Update a review by ID (only if user owns it)."""
    try:
        # First check if review exists and user owns it
        review = await review_repo.get_by_id(review_id)
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        if review.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this review",
            )

        updated_review = await review_repo.update(review_id, review_data)
        return ReviewResponse.model_validate(updated_review.model_dump(by_alias=False))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update review {review_id}: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to update review: {e!s}")


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Delete a review by ID (only if user owns it)."""
    try:
        # First check if review exists and user owns it
        review = await review_repo.get_by_id(review_id)
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        if review.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this review",
            )

        await review_repo.delete(review_id)
        return

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete review {review_id}: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to delete review: {e!s}")


@router.get("/business/{business_id}", response_model=list[ReviewResponse])
async def list_business_reviews(
    business_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    skip: int = Query(0, ge=0, description="Number of reviews to skip"),
    limit: int = Query(50, ge=1, le=10000, description="Number of reviews to return"),
    has_analysis: Optional[bool] = Query(None, description="Filter by analysis presence"),
    needs_attention: Optional[bool] = Query(None, description="Filter by urgency flags"),
    sentiment: Optional[str] = Query(None, regex="^(positive|negative|neutral)$", description="Filter by sentiment"),
    is_spam: Optional[bool] = Query(None, description="Filter by spam detection"),
    job_id: Optional[str] = Query(None, description="Filter by specific job"),
    source_id: Optional[str] = Query(None, description="Filter by specific source"),
    location_id: Optional[str] = Query(None, description="Filter by specific location"),
):
    """Get all reviews of a business with optional filters (only if user owns the business)."""
    try:
        # Build filters
        filters = {}
        if has_analysis is not None:
            if has_analysis:
                filters["analyzed_data"] = {"$ne": None}
            else:
                filters["analyzed_data"] = None
        
        if needs_attention:
            filters["$or"] = [
                {"analyzed_data.urgency.requires_immediate_response": True},
                {"analyzed_data.urgency.escalation_needed": True}
            ]
        
        if sentiment:
            filters["analyzed_data.sentiment.label"] = sentiment
        
        if is_spam is not None:
            filters["analyzed_data.spam_detection.is_spam"] = is_spam
        
        if job_id:
            filters["job_id"] = job_id
        
        if source_id:
            filters["source_id"] = source_id
        
        if location_id:
            filters["location_id"] = location_id

        reviews = await review_repo.get_by_business(
            business_id=business_id,
            user_id=str(current_user.id),
            skip=skip,
            limit=limit,
            filters=filters
        )

        return [
            ReviewResponse.model_validate(review.model_dump(by_alias=False))
            for review in reviews
        ]

    except Exception as e:
        logger.error(f"Failed to retrieve business's reviews: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve business's reviews: {e!s}",
        )


@router.get("/business/{business_id}/paginated", response_model=PaginatedReviewResponse)
async def get_paginated_business_reviews(
    business_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=1000, description="Number of reviews per page"),
    has_analysis: Optional[bool] = Query(None, description="Filter by analysis presence"),
    needs_attention: Optional[bool] = Query(None, description="Filter by urgency flags"),
    sentiment: Optional[str] = Query(None, regex="^(positive|negative|neutral)$", description="Filter by sentiment"),
    is_spam: Optional[bool] = Query(None, description="Filter by spam detection"),
):
    """Get paginated reviews of a business with optional filters."""
    try:
        skip = (page - 1) * limit
        
        # Build filters
        filters = {}
        if has_analysis is not None:
            if has_analysis:
                filters["analyzed_data"] = {"$ne": None}
            else:
                filters["analyzed_data"] = None
        
        if needs_attention:
            filters["$or"] = [
                {"analyzed_data.urgency.requires_immediate_response": True},
                {"analyzed_data.urgency.escalation_needed": True}
            ]
        
        if sentiment:
            filters["analyzed_data.sentiment.label"] = sentiment
        
        if is_spam is not None:
            filters["analyzed_data.spam_detection.is_spam"] = is_spam

        # Get reviews and total count
        reviews = await review_repo.get_by_business(
            business_id=business_id,
            user_id=str(current_user.id),
            skip=skip,
            limit=limit,
            filters=filters
        )
        
        total = await review_repo.count_by_business(
            business_id=business_id,
            user_id=str(current_user.id),
            filters=filters
        )
        
        pages = (total + limit - 1) // limit  # Ceiling division

        return PaginatedReviewResponse(
            reviews=[
                ReviewResponse.model_validate(review.model_dump(by_alias=False))
                for review in reviews
            ],
            total=total,
            page=page,
            pages=pages
        )

    except Exception as e:
        logger.error(f"Failed to retrieve paginated business reviews: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve paginated business reviews: {e!s}",
        )


@router.get("/job/{job_id}", response_model=list[ReviewResponse])
async def get_reviews_by_job(
    job_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Get all reviews of a job (only if user owns the job)."""
    try:
        logger.info("Getting reviews by job ID endpoint")
        reviews = await review_repo.get_by_job(
            job_id=job_id,
            user_id=str(current_user.id),
            skip=skip,
            limit=limit
        )

        return [
            ReviewResponse.model_validate(review.model_dump(by_alias=False))
            for review in reviews
        ]

    except Exception as e:
        logger.error(f"Failed to retrieve job's reviews: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve job's reviews: {e!s}",
        )


@router.get("/source/{source_id}", response_model=list[ReviewResponse])
async def get_reviews_by_source(
    source_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Get all reviews of a source (only if user owns the source)."""
    try:
        reviews = await review_repo.get_by_source(
            source_id=source_id,
            user_id=str(current_user.id),
            skip=skip,
            limit=limit
        )

        return [
            ReviewResponse.model_validate(review.model_dump(by_alias=False))
            for review in reviews
        ]

    except Exception as e:
        logger.error(f"Failed to retrieve source's reviews: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve source's reviews: {e!s}",
        )


@router.get("/location/{location_id}", response_model=list[ReviewResponse])
async def get_reviews_by_location(
    location_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Get all reviews of a location (only if user owns the location)."""
    try:
        reviews = await review_repo.get_by_location(
            location_id=location_id,
            user_id=str(current_user.id),
            skip=skip,
            limit=limit
        )

        return [
            ReviewResponse.model_validate(review.model_dump(by_alias=False))
            for review in reviews
        ]

    except Exception as e:
        logger.error(f"Failed to retrieve location's reviews: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve location's reviews: {e!s}",
        )