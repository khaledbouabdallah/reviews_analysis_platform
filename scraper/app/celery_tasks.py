import logging
import tempfile
from datetime import datetime, timezone
from typing import Any

from celery.signals import worker_ready, worker_shutdown
from celery_app import celery_app
from db_sync import sync_db
from scrapers.google_reviews.runner import ScrapingJobManager
from scrapers.google_reviews.scrapper import GoogleMapsReviewScraper, ScraperConfig

logger = logging.getLogger(__name__)

# Global persistent scraper instance (one per worker process)
persistent_scraper = None
persistent_job_manager = None


@worker_ready.connect
def setup_scraper(sender=None, **kwargs):
    """Initialize browser when worker starts"""
    global persistent_scraper
    global persistent_job_manager
    logger.info("Worker starting - initializing persistent browser...")

    persistent_job_manager = ScrapingJobManager()

    config = ScraperConfig(
        headless=True,
        verbose=True,
        timeout=15,
        original=True,
        language="en",
        concat_extra=False,
        log_file="persistent_worker",
        extra_headers=[
            "--no-sandbox",
            "--disable-dev-shm-usage",
            f"--user-data-dir={tempfile.mkdtemp()}",
        ],
        progress_callback=persistent_job_manager.handle_progress,
    )

    persistent_scraper = GoogleMapsReviewScraper(config=config)
    logger.info("Persistent browser ready")


@worker_shutdown.connect
def cleanup_scraper(sender=None, **kwargs):
    """Clean up browser when worker shuts down"""
    global persistent_scraper
    if persistent_scraper:
        logger.info("Worker shutting down - closing browser...")
        try:
            persistent_scraper.exit(force=True)
        except:
            pass
        persistent_scraper = None


def _recreate_browser():
    """Recreate the browser if it breaks"""
    global persistent_scraper
    global persistent_job_manager

    logger.info("Recreating browser...")

    # Clean up old browser
    if persistent_scraper:
        try:
            persistent_scraper.exit(force=True)
        except:
            pass

    # Create new browser
    config = ScraperConfig(
        headless=True,
        verbose=True,
        timeout=15,
        original=True,
        language="en",
        concat_extra=False,
        log_file="persistent_worker",
        extra_headers=[
            "--no-sandbox",
            "--disable-dev-shm-usage",
            f"--user-data-dir={tempfile.mkdtemp()}",
        ],
        progress_callback=persistent_job_manager.handle_progress,
    )

    persistent_scraper = GoogleMapsReviewScraper(config=config)
    logger.info("Browser recreated")


@celery_app.task(bind=True, name="celery_tasks.scraper_task")
def scraper_task(self, job_id: str, job_data: dict) -> dict[str, Any]:
    """Main Celery task for scraping Google Maps reviews"""
    global persistent_scraper
    global persistent_job_manager

    logger.info(f"Starting scraper task for job {job_id}")

    persistent_job_manager.set_job(job_id, job_data)

    try:
        # Update job status to running
        sync_db.update_job_status(
            job_id=job_id, status="running", started_at=datetime.now(timezone.utc)
        )

        # Try scraping with persistent browser
        try:
            data = persistent_scraper.scrap(job_data["url"])

        except Exception as e:
            # Something wrong with browser - recreate it and try again
            logger.warning(f"Browser error: {e}. Recreating browser...")
            _recreate_browser()
            data = persistent_scraper.scrap(job_data["url"])

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


@celery_app.task(name="celery_tasks.cancel_job_task")
def cancel_job_task(job_id: str) -> dict[str, Any]:
    """Task to handle job cancellation cleanup"""
    logger.info(f"Processing cancellation for job {job_id}")

    try:
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
def health_check_task(self) -> dict[str, Any]:
    """Health check task"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "worker_id": self.request.hostname if hasattr(self, "request") else "unknown",
    }
