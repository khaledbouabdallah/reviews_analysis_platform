# backend/app/api/routers/reviews.py (SECURED VERSION)

from api.dependencies import get_current_active_user
from core.config import logger
from db.repositories.reviews import ReviewRepository
from fastapi import APIRouter, Depends, HTTPException, status
from models.review import ReviewResponse, ReviewUpdate
from models.user import UserInDB

router = APIRouter(prefix="/reviews", tags=["reviews"])
review_repo = ReviewRepository()


@router.get("/", response_model=list[ReviewResponse])
async def list_user_reviews(
    skip: int = 0,
    limit: int = 5000,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """
    List reviews for the authenticated user only.
    """
    try:
        reviews = await review_repo.get_by_user(str(current_user.id), skip=skip)
        # Apply limit in Python since get_by_user doesn't have limit param
        reviews = reviews[:limit]

        return [
            ReviewResponse.model_validate(review.model_dump(by_alias=True))
            for review in reviews
        ]

    except Exception as e:
        logger.error(f"Failed to retrieve reviews: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve reviews: {e!s}"
        )


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(
    review_id: str, current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Get a review by ID (only if user owns it).
    """
    try:
        review = await review_repo.get_by_id(review_id)
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        # Check if user owns this review
        if review.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this review",
            )

        return ReviewResponse.model_validate(review.model_dump(by_alias=True))

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
    """
    Update a review by ID (only if user owns it).
    """
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
        return ReviewResponse.model_validate(updated_review.model_dump(by_alias=True))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update review {review_id}: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to update review: {e!s}")


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: str, current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Delete a review by ID (only if user owns it).
    """
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
async def get_reviews_by_business(
    business_id: str,
    skip: int = 0,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """
    Get all reviews of a business (only if user owns the business).
    """
    try:
        reviews = await review_repo.get_by_business(business_id, skip=skip)

        # Filter to only include reviews owned by current user
        user_reviews = [
            review for review in reviews if review.user_id == current_user.id
        ]

        return [
            ReviewResponse.model_validate(review.model_dump(by_alias=True))
            for review in user_reviews
        ]

    except Exception as e:
        logger.error(f"Failed to retrieve business's reviews: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve business's reviews: {e!s}"
        )


@router.get("/source/{source_id}", response_model=list[ReviewResponse])
async def get_reviews_by_source(
    source_id: str,
    skip: int = 0,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """
    Get all reviews of a source (only if user owns the source).
    """
    try:
        reviews = await review_repo.get_by_source(source_id, skip=skip)

        # Filter to only include reviews owned by current user
        user_reviews = [
            review for review in reviews if review.user_id == current_user.id
        ]

        return [
            ReviewResponse.model_validate(review.model_dump(by_alias=True))
            for review in user_reviews
        ]

    except Exception as e:
        logger.error(f"Failed to retrieve source's reviews: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve source's reviews: {e!s}"
        )


@router.get("/job/{job_id}", response_model=list[ReviewResponse])
async def get_reviews_by_job(
    job_id: str,
    skip: int = 0,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """
    Get all reviews of a job (only if user owns the job).
    """
    try:
        reviews = await review_repo.get_by_job(job_id, skip=skip)

        # Filter to only include reviews owned by current user
        user_reviews = [
            review for review in reviews if review.user_id == current_user.id
        ]

        return [
            ReviewResponse.model_validate(review.model_dump(by_alias=True))
            for review in user_reviews
        ]

    except Exception as e:
        logger.error(f"Failed to retrieve job's reviews: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve job's reviews: {e!s}"
        )
