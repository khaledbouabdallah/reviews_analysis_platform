import logging
from datetime import datetime, timezone

from anyio import to_thread
from scrapers.google_reviews.google_reviews_scrapper import GoogleMapsReviewScraper

logging.basicConfig(level=logging.INFO)
import tempfile

from db.repositories.jobs import JobRepository
from db.repositories.reviews import ReviewRepository
from models.job import JobCreate, JobUpdateInternal
from models.review import ReviewCreate

job_repo = JobRepository()
review_repo = ReviewRepository()


async def run_scraper_job(job_id: str, job: JobCreate):

    print(f"Starting job {job_id}")

    update_data = JobUpdateInternal(
        status="running", started_at=datetime.now(timezone.utc)
    )

    await job_repo.update_internal(job_id, update_data)

    total_reviews = 0
    reviews_scraped = 0

    try:
        # Initialize scraper
        scraper = GoogleMapsReviewScraper(
            headless=False,
            verbose=True,
            timeout=10,
            original=True,
            language="en",
            concat_extra=False,
            log_file=f"job_{job_id}",
            extra_headers=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                f"--user-data-dir={tempfile.mkdtemp()}",
            ],
        )

        print("conntection established to google maps reviews link")

        # Connect to URL and get review count
        total_reviews = await to_thread.run_sync(scraper.connect, job.url)
        logging.info(f"Total reviews found: {total_reviews}")
        # Extract data
        if total_reviews > 0:
            data = await to_thread.run_sync(scraper.extract_data, total_reviews)
            logging.info(f"Extracted {len(data)} reviews")
            reviews_scraped = len(data)

        else:
            # No reviews found
            reviews_scraped = 0

        status = "completed"

    except Exception as e:
        status = "failed"
        error = str(e)
    finally:

        update_data = JobUpdateInternal(
            status=status,
            ended_at=datetime.now(timezone.utc),
            total_reviews=total_reviews,
            reviews_scraped=reviews_scraped,
            error=error if status == "failed" else None,
            reviews=data if status == "completed" else [],
        )

        await job_repo.update_internal(job_id, update_data)
        logging.info(
            f"Job {job_id} finished with status: {status}, error: {error if status == 'failed' else None}"
        )

        # save reviews to database
        i = 0
        if status == "completed":
            for review in data:
                review_data = ReviewCreate(
                    user_id=job.user_id,
                    business_id=job.business_id,
                    source_id=job.source_id,
                    job_id=job.job_id,
                    data=review,
                    source_type=job.source_type,
                )
                await review_repo.create(review_data)
                i += 1
        logging.info(f"Saved {i} reviews to database")

        try:
            scraper.exit(force=True)
            logging.info("Scraper exited successfully")
        except:
            pass
