# backend/app/api/routers/review_analyzer.py

import asyncio
import traceback
from typing import Literal

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
from services.subscription_service import subscription_service

router = APIRouter(prefix="/review_analyzer", tags=["review_analyzer"])

# Repository instances
review_repo = ReviewRepository()
job_repo = JobRepository()
business_repo = BusinessRepository()
source_repo = SourceRepository()
location_repo = LocationRepository()

# Entity type mapping
EntityType = Literal["job", "source", "business", "location"]

# Repository mapping for cleaner code
ENTITY_REPOS = {
    "job": job_repo,
    "source": source_repo,
    "business": business_repo,
    "location": location_repo,
}

# Review fetching methods mapping
REVIEW_METHODS = {
    "job": lambda entity_id, user_id: review_repo.get_by_job(job_id=entity_id, user_id=user_id),
    "source": lambda entity_id, user_id: review_repo.get_by_source(entity_id, user_id=user_id),
    "business": lambda entity_id, user_id: review_repo.get_by_business(entity_id, user_id=user_id),
    "location": lambda entity_id, user_id: review_repo.get_by_location(entity_id, user_id=user_id),
}


async def validate_entity_ownership(
    entity_type: EntityType,
    entity_id: str,
    current_user: UserInDB,
) -> tuple[any, BusinessRepository]:
    """Validate entity exists and user owns it. Returns (entity, business)."""
    repo = ENTITY_REPOS[entity_type]
    
    # Get entity
    entity = await repo.get_by_id(entity_id)
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{entity_type.capitalize()} not found",
        )
    
    # Check ownership
    if entity.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Not authorized to analyze this {entity_type}",
        )
    
    # Get business for context
    business_id = getattr(entity, 'business_id', entity_id if entity_type == 'business' else None)
    business = await business_repo.get_by_id(business_id)
    
    return entity, business


async def get_entity_reviews(
    entity_type: EntityType,
    entity_id: str,
    current_user: UserInDB,
) -> list:
    """Get reviews for the specified entity."""
    get_reviews_method = REVIEW_METHODS[entity_type]
    
    if entity_type == "job":
        # Special handling for job reviews with user_id parameter
        reviews = await get_reviews_method(entity_id, current_user.id)
    
    # Filter to user's reviews only
    user_reviews = [
        review for review in reviews if review.user_id == current_user.id
    ]
    
    if not user_reviews:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No reviews found for {entity_type} {entity_id}",
        )
    
    return user_reviews


def parse_analysis_request(
    business,
    analysis_request: dict | None,
) -> tuple[list, list, str]:
    """Parse analysis request and extract tasks, topics, context."""
    tasks = analysis_tasks
    target_topics = (
        business.segments
        if business and business.segments
        else analysis_request.get("target_topics") if analysis_request else None
    )
    business_context = (
        business.context
        if business and business.context
        else analysis_request.get("business_context") if analysis_request else None
    )
    
    if not tasks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one analysis task must be specified",
        )
    
    return tasks, target_topics, business_context

def estimate_tokens(review_inputs: list["ReviewInput"]) -> int:
    text = " ".join([inp.text for inp in review_inputs])
    input_approx = (len(text) // 4)  # fast estimate
    output_approx = input_approx * 10
    return int(input_approx + output_approx)

async def user_passed_his_limit(review_inputs: list[ReviewInput], current_user: UserInDB) -> bool:
    get_current_usage = await subscription_service.get_current_usage(str(current_user.id))
    tokens_used = get_current_usage.tokens_used
    user_limit = get_current_usage.tokens_limit
    token_estimation = estimate_tokens(review_inputs)
    logger.info(f"User {current_user.id} has used {tokens_used}/{user_limit} tokens. Estimated tokens for this request: {token_estimation}")
    return tokens_used + token_estimation > user_limit

@router.post("/batch/{entity_type}/{entity_id}")
async def analyze_entity_reviews(
    entity_type: EntityType,
    entity_id: str,
    analysis_request: dict | None = None,
    override_analysis: bool = False,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Analyze all reviews from a specified entity (job, source, business, or location)."""
    try:
        # Validate entity and ownership
        entity, business = await validate_entity_ownership(
            entity_type, entity_id, current_user
        )
        
        # Get reviews for entity
        user_reviews = await get_entity_reviews(
            entity_type, entity_id, current_user
        )
        
        logger.info(
            f"Found {len(user_reviews)} reviews for {entity_type} {entity_id} "
            f"owned by user {current_user.id}"
        )
        
        # Parse analysis request
        tasks, target_topics, business_context = parse_analysis_request(
            business, analysis_request
        )
        
        # Create batch processor and run analysis
        batch_processor = BatchProcessor(user_reviews, str(current_user.id), override_analysis)
        if len(batch_processor.review_inputs) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid reviews found for analysis"
            )

        is_limit_exceeded = await user_passed_his_limit(batch_processor.review_inputs, current_user)
        if is_limit_exceeded:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="User has exceeded their token limit"
            )
    
        # Start the analysis in the background
        asyncio.create_task(
            batch_processor.process_all_reviews(
                tasks=tasks,
                target_topics=target_topics,
                business_context=business_context,
            )
        )
        
        # Return immediately with job info
        return {
            "success": True,
            "message": "Analysis job started successfully",
            "status": "running"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error analyzing reviews for {entity_type} {entity_id}: {e!s}\n"
            f"{traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze reviews for {entity_type} {entity_id}: {e!s}",
        )


# Keep legacy endpoints for backward compatibility (optional - can be removed after frontend update)
@router.post("/batch/job/{job_id}")
async def analyze_job_reviews_legacy(
    job_id: str,
    analysis_request: dict | None = None,
    override_analysis: bool = False,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Legacy endpoint - redirects to new generic endpoint."""
    return await analyze_entity_reviews("job", job_id, analysis_request,override_analysis, current_user)


@router.post("/batch/source/{source_id}")
async def analyze_source_reviews_legacy(
    source_id: str,
    analysis_request: dict | None = None,
    override_analysis: bool = False,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Legacy endpoint - redirects to new generic endpoint."""
    return await analyze_entity_reviews("source", source_id, analysis_request,override_analysis, current_user)


@router.post("/batch/business/{business_id}")
async def analyze_business_reviews_legacy(
    business_id: str,
    analysis_request: dict | None = None,
    override_analysis: bool = False,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Legacy endpoint - redirects to new generic endpoint."""
    return await analyze_entity_reviews("business", business_id, analysis_request,override_analysis, current_user)


@router.post("/batch/location/{location_id}")
async def analyze_location_reviews_legacy(
    location_id: str,
    analysis_request: dict | None = None,
    override_analysis: bool = False,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Legacy endpoint - redirects to new generic endpoint."""
    return await analyze_entity_reviews("location", location_id, analysis_request,override_analysis, current_user)


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
        business = await business_repo.get_by_id(review.business_id)
        tasks, target_topics, business_context = parse_analysis_request(
            business, analysis_request
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
            # Update review with analysis results
            analysis_data = result["analysis"]
            if isinstance(analysis_data, list) and analysis_data:
                analysis_data = analysis_data[0]

            # Update the review's analyzed_data
            await review_repo.update_analysis(
                review_id, 
                analysis_data, 
                processing_status="completed"
            )

            return {
                "success": True,
                "review_id": review_id,
                "analysis": analysis_data,
                "duration": result.get("duration"),
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Analysis failed: {result.get('error', 'Unknown error')}",
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing single review {review_id}: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze review: {e!s}",
        )