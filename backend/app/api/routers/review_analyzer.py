# backend/app/api/routers/review_analyzer.py

import traceback

from api.dependencies import get_current_active_user
from core.config import logger
from db.repositories.businesses import BusinessRepository
from db.repositories.jobs import JobRepository
from db.repositories.locations import LocationRepository
from db.repositories.reviews import ReviewRepository
from db.repositories.sources import SourceRepository
from fastapi import APIRouter, Depends, HTTPException, status
from models.analysis_requests import ReviewInput
from models.user import UserInDB
from services.review_analysis.batch_processor import BatchProcessor
from services.review_analysis.review_analyzer import analysis_tasks, review_analyzer

router = APIRouter(prefix="/review_analyzer", tags=["review_analyzer"])

# Repository instances
review_repo = ReviewRepository()
job_repo = JobRepository()
business_repo = BusinessRepository()
source_repo = SourceRepository()
location_repo = LocationRepository()


@router.post("/batch/job/{job_id}")
async def analyze_job_reviews(
    job_id: str,
    analysis_request: dict | None = None,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Analyze all reviews from a scraping job (only if user owns the job)."""
    try:
        # Verify the job exists and user owns it
        job = await job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )
        if job.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to analyze this job",
            )

        # Get all reviews for the job
        reviews = await review_repo.get_by_job(job_id)
        if not reviews:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No reviews found for job {job_id}",
            )

        logger.info(
            f"Found {len(reviews)} reviews for job {job_id} owned by user {current_user.id}"
        )

        # Filter to only include reviews owned by current user
        user_reviews = [
            review for review in reviews if review.user_id == current_user.id
        ]

        logger.info(
            f"Filtered to {len(user_reviews)} reviews owned by user {current_user.id}"
        )

        if not user_reviews:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No reviews found for job {job_id}",
            )

        # Parse analysis request
        business = await business_repo.get_by_id(job.business_id)
        tasks = analysis_tasks
        target_topics = (
            business.segments
            if business.segments
            else analysis_request.get("target_topics")
        )
        business_context = (
            business.context
            if business.context
            else analysis_request.get("business_context")
        )

        if not tasks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one analysis task must be specified",
            )

        # Create batch processor and run analysis
        batch_processor = BatchProcessor(user_reviews, str(current_user.id))
        result = await batch_processor.process_all_reviews(
            tasks=tasks,
            target_topics=target_topics,
            business_context=business_context,
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error analyzing reviews for job {job_id}: {e!s}\n{traceback.format_exc()}",
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during review analysis.",
        ) from e


@router.post("/batch/source/{source_id}")
async def analyze_source_reviews(
    source_id: str,
    analysis_request: dict | None = None,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Analyze all reviews from a source (only if user owns the source)."""
    try:
        # Verify the source exists and user owns it
        source = await source_repo.get_by_id(source_id)
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Source not found",
            )
        if source.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to analyze this source",
            )

        # Get all reviews for the source
        reviews = await review_repo.get_by_source(source_id)
        user_reviews = [
            review for review in reviews if review.user_id == current_user.id
        ]

        if not user_reviews:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No reviews found for source {source_id}",
            )

        # Parse analysis request
        business = await business_repo.get_by_id(source.business_id)
        tasks = analysis_tasks
        target_topics = (
            business.segments
            if business.segments
            else analysis_request.get("target_topics")
        )
        business_context = (
            business.context
            if business.context
            else analysis_request.get("business_context")
        )

        if not tasks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one analysis task must be specified",
            )

        # Create batch processor and run analysis
        batch_processor = BatchProcessor(user_reviews, str(current_user.id))
        result = await batch_processor.process_all_reviews(
            job_id=f"source_analysis_{source_id}",
            tasks=tasks,
            target_topics=target_topics,
            business_context=business_context,
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing reviews for source {source_id}: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze reviews for source {source_id}: {e!s}",
        )


@router.post("/batch/business/{business_id}")
async def analyze_business_reviews(
    business_id: str,
    analysis_request: dict | None = None,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Analyze all reviews from a business (only if user owns the business)."""
    try:
        # Verify the business exists and user owns it
        business = await business_repo.get_by_id(business_id)
        if not business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found",
            )
        if business.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to analyze this business",
            )

        # Get all reviews for the business
        reviews = await review_repo.get_by_business(business_id)
        user_reviews = [
            review for review in reviews if review.user_id == current_user.id
        ]

        if not user_reviews:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No reviews found for business {business_id}",
            )

        # Parse analysis request
        tasks = analysis_tasks
        target_topics = (
            business.segments
            if business.segments
            else analysis_request.get("target_topics")
        )
        business_context = (
            business.context
            if business.context
            else analysis_request.get("business_context")
        )

        if not tasks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one analysis task must be specified",
            )

        # Create batch processor and run analysis
        batch_processor = BatchProcessor(user_reviews, str(current_user.id))
        result = await batch_processor.process_all_reviews(
            job_id=f"business_analysis_{business_id}",
            tasks=tasks,
            target_topics=target_topics,
            business_context=business_context,
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing reviews for business {business_id}: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze reviews for business {business_id}: {e!s}",
        )


@router.post("/batch/location/{location_id}")
async def analyze_location_reviews(
    location_id: str,
    analysis_request: dict | None = None,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Analyze all reviews from a location (only if user owns the location)."""
    try:
        # Verify the location exists and user owns it
        location = await location_repo.get_by_id(location_id)
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found",
            )
        if location.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to analyze this location",
            )

        # Get all reviews for the location (assuming reviews have location_id)
        # Note: You might need to add get_by_location method to ReviewRepository
        reviews = await review_repo.get_by_location(location_id)
        user_reviews = [
            review for review in reviews if review.user_id == current_user.id
        ]

        if not user_reviews:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No reviews found for location {location_id}",
            )

        # Parse analysis request
        business = await business_repo.get_by_id(location.business_id)
        tasks = analysis_tasks
        target_topics = (
            business.segments
            if business.segments
            else analysis_request.get("target_topics")
        )
        business_context = (
            business.context
            if business.context
            else analysis_request.get("business_context")
        )

        if not tasks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one analysis task must be specified",
            )

        # Create batch processor and run analysis
        batch_processor = BatchProcessor(user_reviews, str(current_user.id))
        result = await batch_processor.process_all_reviews(
            job_id=f"location_analysis_{location_id}",
            tasks=tasks,
            target_topics=target_topics,
            business_context=business_context,
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing reviews for location {location_id}: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze reviews for location {location_id}: {e!s}",
        )


@router.post("/single/{review_id}")
async def analyze_single_review(
    review_id: str,
    analysis_request: dict | None = None,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Analyze a single review by ID (only if user owns the review)."""
    try:
        # Get the review
        review = await review_repo.get_by_id(review_id)
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found",
            )

        # Check if user owns this review
        if review.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to analyze this review",
            )

        # Parse analysis request
        # Parse analysis request
        business = await business_repo.get_by_id(review.business_id)
        tasks = analysis_tasks
        target_topics = (
            business.segments
            if business.segments
            else analysis_request.get("target_topics")
        )
        business_context = (
            business.context
            if business.context
            else analysis_request.get("business_context")
        )

        if not tasks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one analysis task must be specified",
            )

        # Convert to ReviewInput format
        text = (
            review.data.get("comment")
            or review.data.get("original_text")
            or review.data.get("text", "")
        )
        if not text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Review has no text content to analyze",
            )

        review_input = ReviewInput(
            text=text,
            rating=review.data.get("rating"),
            business_type=review.data.get("business_type"),
            source=review.source_type,
            metadata={"review_id": str(review.id)},
        )

        # Analyze single review
        result = await review_analyzer.analyze(
            reviews=[review_input],
            user_id=str(current_user.id),
            tasks=tasks,
            target_topics=target_topics,
            business_context=business_context,
        )

        if result["success"]:
            # Save analysis result back to review
            analysis_dict = (
                result["analysis"].model_dump()
                if hasattr(result["analysis"], "model_dump")
                else result["analysis"]
            )

            analyzed_data = {
                "analysis_results": analysis_dict,
                "processing_status": "completed",
                "processed_at": result.get("duration"),
            }

            await review_repo.update_processed_data(review_id, analyzed_data)

        return {
            "success": result["success"],
            "review_id": review_id,
            "analysis": result.get("analysis"),
            "error": result.get("error"),
            "duration": result.get("duration"),
            "cost": result.get("cost"),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing single review {review_id}: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze review {review_id}: {e!s}",
        )
