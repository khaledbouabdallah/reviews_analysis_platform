from fastapi import APIRouter, HTTPException, status
from typing import List
from pymongo.errors import DuplicateKeyError
from db.repositories.reviews import ReviewRepository
from models.business import BusinessCreate, BusinessUpdate, BusinessInDB, BusinessResponse
from core.config import logger
from services.basic_analysis import BasicAnalyzer
from services.summary import summarize_reviews



review_repo = ReviewRepository()

router = APIRouter(prefix="/analyzer", tags=["analyzer"])

@router.get("/simple/batch/job/{job_id}")
async def simple_analyzer_on_job_reviews(job_id: str):
    """
    Endpoint to analyze reviews from a scraping job.
    
    - **job_id**: ID of the scraping job whose reviews will be analyzed
    """
    try:
        
        basic_analyzer = BasicAnalyzer()
        reviews = review_repo.get_by_job(job_id)
        
        reviews_analyzed = await basic_analyzer.batch_simple_analyze(reviews)
        if len(reviews_analyzed) == len(reviews):
            # return success 200 
            return {"message": "All reviews analyzed successfully", "count": len(reviews_analyzed)}
        else:
            # return partial success 206
            return {"message": "Some reviews were not analyzed", "count": len(reviews_analyzed)}
        
    except Exception as e:
        logger.error(f"Error analyzing reviews for job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze reviews for job {job_id}: {str(e)}"
        )
        
@router.get("/summary/job/{job_id}")
async def summarize_job_reviews(job_id: str):
    """
    Endpoint to summarize reviews from a scraping job.
    
    - **job_id**: ID of the scraping job whose reviews will be summarized
    """
    try:
        reviews = review_repo.get_by_job(job_id)
        
        if not reviews:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No reviews found for job {job_id}"
            )
            
        # remove empty comments and small comments
        reviews = [review.data.get('comment') for review in reviews if len(review.data.get('comment', '')) > 20]
        
        summary = await summarize_reviews(reviews)
        return {"job_id": job_id, "summary": summary}
    
    except Exception as e:
        logger.error(f"Error summarizing reviews for job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to summarize reviews for job {job_id}: {str(e)}"
        )