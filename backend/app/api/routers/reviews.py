from models.review import ReviewUpdate, ReviewResponse
from db.repositories.reviews import ReviewRepository
from core.config import logger
from fastapi import APIRouter, HTTPException, status
from typing import List



router = APIRouter(prefix="/reviews", tags=["reviews"])
review_repo = ReviewRepository()



@router.get("/", response_model=List[ReviewResponse])
async def list_reviews(skip: int = 0, limit: int = 5000):
    """ Endpoint to list all reviews.
    This endpoint retrieves a list of reviews from the database.
    """
    try:
        reviews = await review_repo.get_all(skip=skip, limit=limit)
        return [ReviewResponse.model_validate(review.model_dump(by_alias=True)) for review in reviews]
    
    except Exception as e:
        logger.error(f"Failed to retrieve reviews: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve reviews: {str(e)}")
    
@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(review_id: str):
    """ Endpoint to retrieve a review by its ID.
    This endpoint fetches a specific review from the database using its ID.
    """
    try:
        review = await review_repo.get_by_id(review_id)
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        return ReviewResponse.model_validate(review.model_dump(by_alias=True))
    
    except Exception as e:
        logger.error(f"Failed to retrieve review {review_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve review: {str(e)}")
    
@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(review_id: str, review_data: ReviewUpdate):
    """ Endpoint to update a review by its ID.
    This endpoint modifies an existing review in the database using its ID.
    """
    try:
        updated_review = await review_repo.update(review_id, review_data)
        if not updated_review:
            raise HTTPException(status_code=404, detail="Review not found")
        return ReviewResponse.model_validate(updated_review.model_dump(by_alias=True))
    
    except Exception as e:
        logger.error(f"Failed to update review {review_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update review: {str(e)}")
    
    
@router.get("/user/{user_id}", response_model=List[ReviewResponse])
async def get_reviews_by_user(user_id: str, skip: int = 0):
    """ Endpoint to retrieve all reviews of a user.
    This endpoint fetches reviews associated with a specific user ID.
    """
    try:
        reviews = await review_repo.get_by_user(user_id, skip=skip)
        return [ReviewResponse.model_validate(review.model_dump(by_alias=True)) for review in reviews]
    
    except Exception as e:
        logger.error(f"Failed to retrieve user's reviews: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user's reviews: {str(e)}")
@router.get("/business/{business_id}", response_model=List[ReviewResponse])
async def get_reviews_by_business(business_id: str, skip: int = 0):
    """ Endpoint to retrieve all reviews of a business.
    This endpoint fetches reviews associated with a specific business ID.
    """
    try:
        reviews = await review_repo.get_by_business(business_id, skip=skip)
        return [ReviewResponse.model_validate(review.model_dump(by_alias=True)) for review in reviews]
    
    except Exception as e:
        logger.error(f"Failed to retrieve business's reviews: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve business's reviews: {str(e)}")
@router.get("/source/{source_id}", response_model=List[ReviewResponse])
async def get_reviews_by_source(source_id: str, skip: int = 0):
    """ Endpoint to retrieve all reviews of a source.
    This endpoint fetches reviews associated with a specific source ID.
    """
    try:
        reviews = await review_repo.get_by_source(source_id, skip=skip)
        return [ReviewResponse.model_validate(review.model_dump(by_alias=True)) for review in reviews]
    
    except Exception as e:
        logger.error(f"Failed to retrieve source's reviews: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve source's reviews: {str(e)}")
    
@router.get("/job/{job_id}", response_model=List[ReviewResponse])
async def get_reviews_by_job(job_id: str, skip: int = 0):
    """ Endpoint to retrieve all reviews of a job.
    This endpoint fetches reviews associated with a specific job ID.
    """
    try:
        reviews = await review_repo.get_by_job(job_id, skip=skip)
        return [ReviewResponse.model_validate(review.model_dump(by_alias=True)) for review in reviews]
    
    except Exception as e:
        logger.error(f"Failed to retrieve job's reviews: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve job's reviews: {str(e)}")
