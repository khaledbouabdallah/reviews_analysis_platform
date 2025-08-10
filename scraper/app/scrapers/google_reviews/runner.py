# backend/app/scrapers/google_reviews/runner.py

import logging
import tempfile
from datetime import datetime, timezone
from typing import Any

from db_sync import sync_db
from models.job import JobCreate
from scrapers.google_reviews.scrapper import GoogleMapsReviewScraper, ScraperConfig

# Configure logging
logger = logging.getLogger(__name__)


class ScrapingJobManager:
    """Manages scraping jobs with progress tracking and error handling"""

    def __init__(self):
        pass

    def set_job(self, job_id: str, job: dict) -> None:
        """Set job details for the manager"""
        self.job_id = job_id
        self.job = JobCreate.model_validate(job)
        self.total_reviews = 0
        self.reviews_handled = 0
        self.scraper: GoogleMapsReviewScraper | None = None

        # Progress tracking
        self.progress_data = {
            "total_reviews": 0,
            "current_reviews": 0,
            "progress_percent": 0.0,
            "status": "starting",
            "last_update": datetime.now(timezone.utc),
        }

    def handle_progress(self, progress_info: dict[str, Any]) -> None:
        """Handle progress updates from scraper"""
        try:
            event_type = progress_info.get("event_type")

            logger.info("Handling progress update: %s", progress_info)

            if event_type == "connection_complete":
                self.total_reviews = progress_info.get("total_reviews", 0)
                self.progress_data.update(
                    {"total_reviews": self.total_reviews, "status": "extracting"},
                )
                logger.info(
                    f"Job {self.job_id}: Found {self.total_reviews} total reviews",
                )

                # Update job with total review count
                self._update_job_progress()

            elif event_type == "extraction_progress":
                self.reviews_handled = progress_info.get("current_reviews", 0)
                progress_percent = progress_info.get("progress_percent", 0.0)

                self.progress_data.update(
                    {
                        "current_reviews": self.reviews_handled,
                        "progress_percent": progress_percent,
                        "last_update": datetime.now(timezone.utc),
                    },
                )

                logger.info(
                    f"Job {self.job_id}: Progress {progress_percent:.1f}% ({self.reviews_handled}/{self.total_reviews})",
                )

                # Update job progress every 25 reviews or every 10%
                if self.reviews_handled % 25 == 0 or progress_percent % 10 < 1:
                    logger.info("guess we need to update job progress")
                    self._update_job_progress()

            elif event_type == "scraping_complete":
                status = progress_info.get("status", "completed")
                self.progress_data.update(
                    {"status": status, "last_update": datetime.now(timezone.utc)},
                )
                logger.info(
                    f"Job {self.job_id}: Scraping completed with status {status}",
                )

        except Exception as e:
            logger.warning(f"Job {self.job_id}: Progress callback error: {e}")

    def _update_job_progress(self) -> None:
        """Update job progress in database"""
        try:
            logger.info(
                f"Job {self.job_id}: Updating progress in database: {self.progress_data}"
            )

            sync_db.update_job_status(
                job_id=self.job_id,
                status="running",
                total_reviews=self.progress_data.get("total_reviews"),
                reviews_handled=self.progress_data.get("current_reviews"),
            )

            logger.info(f"Job {self.job_id}: Progress updated successfully")
        except Exception as e:
            logger.warning(f"Job {self.job_id}: Failed to update progress: {e}")

    def save_reviews_batch(
        self, reviews_data: list[dict[str, Any]], batch_size: int = 50
    ) -> int:  # Remove async
        """Save reviews to database in batches"""
        # REPLACE entire method with:
        try:
            saved_count = sync_db.create_reviews_batch(
                job_id=self.job_id,
                user_id=str(self.job.user_id),
                business_id=str(self.job.business_id),
                source_id=str(self.job.source_id),
                source_type=self.job.source_type,
                reviews_data=reviews_data,
                batch_size=batch_size,
            )

            logger.info(f"Job {self.job_id}: Saved {saved_count} reviews")

            # Update progress
            sync_db.update_job_status(
                job_id=self.job_id, reviews_handled=saved_count, status="saving"
            )

            return saved_count

        except Exception as e:
            logger.error(f"Job {self.job_id}: Failed to save reviews: {e}")
            return 0


def run_scraper_job(job_id: str, job: JobCreate) -> dict[str, Any]:
    """Enhanced scraper job runner with progress tracking and error handling

    Args:
        job_id: Job identifier
        job: Job configuration

    Returns:
        Dictionary with job results

    """
    logger.info(f"Starting enhanced scraper job {job_id}")

    # Initialize job manager
    job_manager = ScrapingJobManager(job_id, job)

    # Initialize variables
    error: str | None = None
    data: list[dict[str, Any]] = []
    status = "running"

    try:
        # Update job status to running
        sync_db.update_job_status(
            job_id, "running", started_at=datetime.now(timezone.utc)
        )
        logger.info(f"Job {job_id}: Status updated to running")

        # Configure scraper with progress tracking
        config = ScraperConfig(
            headless=True,  # Use headless for production
            verbose=True,
            timeout=15,  # Increased timeout for reliability
            original=True,
            language="en",
            concat_extra=False,
            log_file=f"job_{job_id}",
            extra_headers=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                f"--user-data-dir={tempfile.mkdtemp()}",
            ],
            progress_callback=job_manager.handle_progress,
        )

        # Initialize scraper
        logger.info(f"Job {job_id}: Initializing scraper")
        job_manager.scraper = GoogleMapsReviewScraper(config=config)

        # Run scraping
        logger.info(f"Job {job_id}: Starting scraping process")
        data = job_manager.scraper.scrap(job.url)

        if data is None:
            # No reviews found
            status = "completed"
            job_manager.total_reviews = 0
            job_manager.reviews_handled = 0
            logger.info(f"Job {job_id}: No reviews found")

        elif len(data) == 0:
            # Empty results
            status = "completed"
            job_manager.total_reviews = 0
            job_manager.reviews_handled = 0
            logger.info(f"Job {job_id}: Empty results returned")

        else:
            # Successfully scraped reviews
            job_manager.reviews_handled = len(data)

            logger.info(
                f"Job {job_id}: Scraped {len(data)} reviews, starting save process",
            )

            status = "saving"
            # Update job status to saving

            sync_db.update_job_status(
                job_id, "saving", started_at=datetime.now(timezone.utc)
            )

            # Save reviews to database in batches
            saved_count = job_manager.save_reviews_batch(data, batch_size=50)

            if saved_count == len(data):
                status = "completed"
                logger.info(
                    f"Job {job_id}: Successfully saved all {saved_count} reviews",
                )
            else:
                status = "partially_completed"
                logger.warning(f"Job {job_id}: Saved {saved_count}/{len(data)} reviews")
                error = f"Only saved {saved_count}/{len(data)} reviews to database"

    except Exception as e:
        status = "failed"
        error = str(e)
        logger.error(f"Job {job_id}: Failed with error: {error}")

    finally:
        # Always update final job status
        try:
            sync_db.update_job_status(
                job_id=job_id,
                status=status,
                ended_at=datetime.now(timezone.utc),
                total_reviews=job_manager.total_reviews,
                reviews_handled=job_manager.reviews_handled,
                error=error,
            )

            logger.info(
                f"Job {job_id}: Final status - {status}, "
                f"Reviews: {job_manager.reviews_handled}/{job_manager.total_reviews}, "
                f"Error: {error or 'None'}",
            )

        except Exception as e:
            logger.error(f"Job {job_id}: Failed to update final status: {e}")

        # Clean up scraper resources
        if job_manager.scraper:
            try:
                job_manager.scraper.exit(force=True)
                logger.info(f"Job {job_id}: Scraper cleaned up successfully")
            except Exception as e:
                logger.warning(f"Job {job_id}: Scraper cleanup error: {e}")

    # Return job results
    return {
        "job_id": job_id,
        "status": status,
        "total_reviews": job_manager.total_reviews,
        "reviews_handled": job_manager.reviews_handled,
        "error": error,
        "data_length": len(data) if data else 0,
    }


# Synchronous wrapper for Celery (since Celery tasks can't be async)
def run_scraper_job_sync(job_id: str, job_data: dict) -> dict[str, Any]:
    """Synchronous wrapper for Celery tasks

    Args:
        job_id: Job identifier
        job_data: Job data dictionary (from JobCreate.model_dump())

    Returns:
        Dictionary with job results

    """
    # Convert dict back to JobCreate model
    job = JobCreate.model_validate(job_data)

    # Run the async function
    return run_scraper_job(job_id, job)
