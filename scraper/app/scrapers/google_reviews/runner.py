# backend/app/scrapers/google_reviews/runner.py

import asyncio
import logging
import tempfile
from datetime import datetime, timezone
from typing import Any

from db.repositories.jobs import JobRepository
from db.repositories.reviews import ReviewRepository
from models.job import JobCreate, JobUpdateInternal
from models.review import ReviewCreate
from scrapers.google_reviews.scrapper import GoogleMapsReviewScraper, ScraperConfig

# Initialize repositories
job_repo = JobRepository()
review_repo = ReviewRepository()

# Configure logging
logger = logging.getLogger(__name__)


class ScrapingJobManager:
    """Manages scraping jobs with progress tracking and error handling"""

    def __init__(self, job_id: str, job: JobCreate):
        self.job_id = job_id
        self.job = job
        self.total_reviews = 0
        self.reviews_scraped = 0
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
                self.reviews_scraped = progress_info.get("current_reviews", 0)
                progress_percent = progress_info.get("progress_percent", 0.0)

                self.progress_data.update(
                    {
                        "current_reviews": self.reviews_scraped,
                        "progress_percent": progress_percent,
                        "last_update": datetime.now(timezone.utc),
                    },
                )

                logger.info(
                    f"Job {self.job_id}: Progress {progress_percent:.1f}% ({self.reviews_scraped}/{self.total_reviews})",
                )

                # Update job progress every 25 reviews or every 10%
                if self.reviews_scraped % 25 == 0 or progress_percent % 10 < 1:
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

    async def _update_job_progress(self) -> None:
        """Update job progress in database"""
        try:
            update_data = JobUpdateInternal(
                total_reviews=self.progress_data.get("total_reviews"),
                reviews_scraped=self.progress_data.get("current_reviews"),
            )
            await job_repo.update_internal(self.job_id, update_data)
        except Exception as e:
            logger.warning(f"Job {self.job_id}: Failed to update progress: {e}")

    async def save_reviews_batch(
        self, reviews_data: list[dict[str, Any]], batch_size: int = 50,
    ) -> int:
        """Save reviews to database in batches"""
        saved_count = 0
        total_batches = (len(reviews_data) + batch_size - 1) // batch_size

        logger.info(
            f"Job {self.job_id}: Saving {len(reviews_data)} reviews in {total_batches} batches",
        )

        for batch_idx in range(0, len(reviews_data), batch_size):
            batch = reviews_data[batch_idx : batch_idx + batch_size]
            batch_num = (batch_idx // batch_size) + 1

            try:
                for review_data in batch:
                    review_create = ReviewCreate(
                        user_id=self.job.user_id,
                        business_id=self.job.business_id,
                        source_id=self.job.source_id,
                        job_id=self.job_id,  # Use job_id parameter, not job.job_id
                        data=review_data,
                        source_type=self.job.source_type,
                    )
                    await review_repo.create(review_create)
                    saved_count += 1

                logger.info(
                    f"Job {self.job_id}: Saved batch {batch_num}/{total_batches} ({len(batch)} reviews)",
                )

                # Update progress after each batch
                update_data = JobUpdateInternal(reviews_scraped=saved_count)
                await job_repo.update_internal(self.job_id, update_data)

            except Exception as e:
                logger.error(
                    f"Job {self.job_id}: Failed to save batch {batch_num}: {e}",
                )
                # Continue with next batch rather than failing entirely
                continue

        return saved_count


async def run_scraper_job(job_id: str, job: JobCreate) -> dict[str, Any]:
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
        update_data = JobUpdateInternal(
            status="running", started_at=datetime.now(timezone.utc),
        )
        await job_repo.update_internal(job_id, update_data)
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
            job_manager.reviews_scraped = 0
            logger.info(f"Job {job_id}: No reviews found")

        elif len(data) == 0:
            # Empty results
            status = "completed"
            job_manager.total_reviews = 0
            job_manager.reviews_scraped = 0
            logger.info(f"Job {job_id}: Empty results returned")

        else:
            # Successfully scraped reviews
            job_manager.reviews_scraped = len(data)

            logger.info(
                f"Job {job_id}: Scraped {len(data)} reviews, starting save process",
            )

            status = "saving"
            # Update job status to saving
            update_data = JobUpdateInternal(
                status="saving",
                total_reviews=job_manager.total_reviews,
                reviews_scraped=job_manager.reviews_scraped,
            )
            await job_repo.update_internal(job_id, update_data)

            # Save reviews to database in batches
            saved_count = await job_manager.save_reviews_batch(data, batch_size=50)

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
            final_update = JobUpdateInternal(
                status=status,
                ended_at=datetime.now(timezone.utc),
                total_reviews=job_manager.total_reviews,
                reviews_scraped=job_manager.reviews_scraped,
                error=error,
            )
            await job_repo.update_internal(job_id, final_update)

            logger.info(
                f"Job {job_id}: Final status - {status}, "
                f"Reviews: {job_manager.reviews_scraped}/{job_manager.total_reviews}, "
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
        "reviews_scraped": job_manager.reviews_scraped,
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
    return asyncio.run(run_scraper_job(job_id, job))


# Backward compatibility function (if needed)
# async def run_scraper_job_simple(job_id: str, job: JobCreate) -> None:
#     """
#     Simplified version that maintains the original function signature
#     """
#     result = await run_scraper_job(job_id, job)

#     # Log final result
#     if result["status"] == "completed":
#         logger.info(f"Job {job_id} completed successfully")
#     elif result["status"] == "failed":
#         logger.error(f"Job {job_id} failed: {result['error']}")
#     else:
#         logger.warning(f"Job {job_id} finished with status: {result['status']}")
