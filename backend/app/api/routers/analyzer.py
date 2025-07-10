# backend/app/api/routers/analyzer.py (SECURED VERSION)

from api.dependencies import get_current_active_user
from core.config import logger
from db.repositories.jobs import JobRepository
from db.repositories.reviews import ReviewRepository
from fastapi import APIRouter, Depends, HTTPException, status
from models.user import UserInDB
from services.basic_analysis import BasicAnalyzer
from services.summary import summarize_reviews

review_repo = ReviewRepository()
job_repo = JobRepository()

router = APIRouter(prefix="/analyzer", tags=["analyzer"])


@router.get("/simple/batch/job/{job_id}")
async def simple_analyzer_on_job_reviews(
    job_id: str, current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Endpoint to analyze reviews from a scraping job (only if user owns the job).
    """
    try:
        # First verify the job exists and user owns it
        job = await job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
            )

        if job.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to analyze this job",
            )

        basic_analyzer = BasicAnalyzer()
        reviews = await review_repo.get_by_job(job_id)

        # Double-check that all reviews belong to the current user
        user_reviews = [
            review for review in reviews if review.user_id == current_user.id
        ]

        reviews_analyzed = await basic_analyzer.batch_simple_analyze(user_reviews)

        if len(reviews_analyzed) == len(user_reviews):
            return {
                "message": "All reviews analyzed successfully",
                "count": len(reviews_analyzed),
            }
        return {
            "message": "Some reviews were not analyzed",
            "count": len(reviews_analyzed),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing reviews for job {job_id}: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze reviews for job {job_id}: {e!s}",
        )


@router.get("/summary/job/{job_id}")
async def summarize_job_reviews(
    job_id: str, current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Endpoint to summarize reviews from a scraping job (only if user owns the job).
    """
    try:
        # First verify the job exists and user owns it
        job = await job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
            )

        if job.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this job",
            )

        reviews = await review_repo.get_by_job(job_id)

        # Double-check that all reviews belong to the current user
        user_reviews = [
            review for review in reviews if review.user_id == current_user.id
        ]

        if not user_reviews:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No reviews found for job {job_id}",
            )

        comments = [
            review.data.get("comment", "")
            for review in user_reviews
            if review.data.get("comment")
        ]

        summary = await summarize_reviews(comments)

        return {"job_id": job_id, "summary": summary}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error summarizing reviews for job {job_id}: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to summarize reviews for job {job_id}: {e!s}",
        )
