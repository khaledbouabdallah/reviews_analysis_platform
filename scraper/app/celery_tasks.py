import logging
from datetime import datetime, timezone
from typing import Any

from celery_app import celery_app
from db_sync import sync_db
from scrapers.google_reviews.runner import run_scraper_job_sync

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="celery_tasks.scraper_task")
def scraper_task(self, job_id: str, job_data: dict) -> dict[str, Any]:
    """Main Celery task for scraping Google Maps reviews

    Args:
        job_id: Job identifier
        job_data: Job data dictionary (from JobCreate.model_dump())

    Returns:
        Dictionary with job results

    """
    logger.info(f"Starting Celery scraper task for job {job_id}")

    try:
        # Update job status to running
        sync_db.update_job_status(
            job_id=job_id, status="running", started_at=datetime.now(timezone.utc),
        )

        # Run the scraper
        result = run_scraper_job_sync(job_id, job_data)

        # Update final job status based on result
        if result["status"] == "completed":
            sync_db.update_job_status(
                job_id=job_id,
                status="completed",
                ended_at=datetime.now(timezone.utc),
                total_reviews=result.get("total_reviews", 0),
                reviews_scraped=result.get("reviews_scraped", 0),
            )
        else:
            sync_db.update_job_status(
                job_id=job_id,
                status="failed",
                ended_at=datetime.now(timezone.utc),
                error=result.get("error", "Unknown error"),
                total_reviews=result.get("total_reviews", 0),
                reviews_scraped=result.get("reviews_scraped", 0),
            )

        logger.info(f"Scraper task {job_id} completed with status: {result['status']}")
        return result

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Scraper task {job_id} failed: {error_msg}")

        # Update job status to failed
        sync_db.update_job_status(
            job_id=job_id,
            status="failed",
            ended_at=datetime.now(timezone.utc),
            error=error_msg,
        )

        # Re-raise to maintain Celery's error behavior
        raise


@celery_app.task(name="celery_tasks.cancel_job_task")
def cancel_job_task(job_id: str) -> dict[str, Any]:
    """Task to handle job cancellation cleanup

    Args:
        job_id: Job identifier to cancel

    Returns:
        Dictionary with cancellation results

    """
    logger.info(f"Processing cancellation for job {job_id}")

    try:
        # Update job status to cancelled
        success = sync_db.update_job_status(
            job_id=job_id,
            status="cancelled",
            ended_at=datetime.now(timezone.utc),
            error="Job was cancelled by user",
        )

        if success:
            return {
                "job_id": job_id,
                "status": "cancelled",
                "message": "Job cancelled successfully",
            }
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    except Exception as e:
        logger.error(f"Failed to cancel job {job_id}: {e}")
        return {"job_id": job_id, "status": "error", "error": str(e)}


@celery_app.task(bind=True, name="celery_tasks.health_check_task")
def health_check_task(self) -> dict[str, Any]:  # Add 'self' parameter
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "worker_id": self.request.hostname if hasattr(self, "request") else "unknown",
    }
