import logging
import tempfile
from datetime import datetime, timezone
from typing import Any

from celery_app import celery_app
from db_sync import sync_db
from scrapers.google_reviews.runner import ScrapingJobManager
from scrapers.google_reviews.scrapper import GoogleMapsReviewScraper, ScraperConfig
from exceptions import JobCancelledException, ReviewsLimitExceededException

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="celery_tasks.scraper_task")
def scraper_task(self, job_id: str, job_data: dict, reviews_used: int, reviews_limit: int) -> dict[str, Any]:
    """Main Celery task for scraping Google Maps reviews"""
    logger.info(f"Starting scraper task for job {job_id} with {reviews_used}/{reviews_limit} reviews used")

    # Create fresh instances for each task
    job_manager = ScrapingJobManager()
    
    config = ScraperConfig(
        headless=True,
        verbose=True,
        timeout=15,
        original=True,
        language="en",
        concat_extra=False,
        log_file=f"worker_job_{job_id}",
        extra_headers=[
            "--no-sandbox",
            "--disable-dev-shm-usage",
            f"--user-data-dir={tempfile.mkdtemp()}",
        ],
        progress_callback=job_manager.handle_progress,
    )

    scraper = GoogleMapsReviewScraper(config=config)
    
    try:
        job_manager.set_job(job_id, job_data)

        # Update job status to running
        sync_db.update_job_status(
            job_id=job_id, status="running", started_at=datetime.now(timezone.utc)
        )

        # Scrape with fresh browser
        data = scraper.scrap(job_data["url"], reviews_used, reviews_limit)

        # Save results
        if data and len(data) > 0:
            saved_count = sync_db.create_reviews_batch(
                job_id=job_id,
                user_id=str(job_data["user_id"]),
                business_id=str(job_data["business_id"]),
                source_id=str(job_data["source_id"]),
                source_type=job_data["source_type"],
                reviews_data=data,
                batch_size=50,
            )

            status = "completed" if saved_count == len(data) else "partially_completed"
            error = (
                None
                if saved_count == len(data)
                else f"Only saved {saved_count}/{len(data)} reviews"
            )
        else:
            saved_count = 0
            status = "completed"
            error = None

        # Update final status
        sync_db.update_job_status(
            job_id=job_id,
            status=status,
            ended_at=datetime.now(timezone.utc),
            total_reviews=len(data) if data else 0,
            reviews_handled=saved_count,
            error=error,
        )

        logger.info(f"Job {job_id} completed: {status}")
        return {
            "job_id": job_id,
            "status": status,
            "total_reviews": len(data) if data else 0,
            "reviews_handled": saved_count,
            "error": error,
        }
        
        
    except JobCancelledException:
        # Job was cancelled - clean exit
        logger.info(f"Job {job_id} cancelled during execution")
        
        # clean job reviews in db 
        
        sync_db.clean_job_reviews(job_id)
        
        return {
            "job_id": job_id,
            "status": "cancelled", 
            "total_reviews": 0,
            "reviews_handled": 0,
            "error": "Job was cancelled by user"
        }

    except ReviewsLimitExceededException:
        logger.warning(f"Job {job_id} failed: Reviews limit exceeded")
        sync_db.update_job_status(
            job_id=job_id,
            status="failed",
            ended_at=datetime.now(timezone.utc),
            error="Reviews limit exceeded"
        )
        return {
            "job_id": job_id,
            "status": "failed",
            "total_reviews": 0,
            "reviews_handled": 0,
            "error": "Reviews limit exceeded"
        }

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Job {job_id} failed: {error_msg}")

        sync_db.update_job_status(
            job_id=job_id,
            status="failed",
            ended_at=datetime.now(timezone.utc),
            error=error_msg,
        )

        return {
            "job_id": job_id,
            "status": "failed",
            "total_reviews": 0,
            "reviews_handled": 0,
            "error": error_msg,
        }
    
    finally:
        # Always clean up browser
        try:
            scraper.exit(force=True)
            logger.info(f"Browser cleaned up for job {job_id}")
        except Exception as cleanup_error:
            logger.warning(f"Browser cleanup failed for job {job_id}: {cleanup_error}")

@celery_app.task(bind=True, name="celery_tasks.health_check_task")
def health_check_task(self) -> dict[str, Any]:
    """Health check task"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "worker_id": self.request.hostname if hasattr(self, "request") else "unknown",
    }