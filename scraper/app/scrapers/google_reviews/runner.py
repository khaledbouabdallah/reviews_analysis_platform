
from datetime import datetime, timezone
from db.mongodb import db, jobs_collection
from services.db_utils import save_reviews_to_mongodb
from scrapers.google_reviews.google_reviews_scrapper import GoogleMapsReviewScraper
from anyio import to_thread
from core.config import settings
import logging
logging.basicConfig(level=logging.INFO)
from models.job import JobCreate, JobUpdateInternal
from db.repositories.jobs import JobRepository

job_repo  = JobRepository()

async def run_scraper_job(job_id: str, job: JobCreate):
    
    update_data = JobUpdateInternal(
        status="running",
        started_at=datetime.now(timezone.utc))
    
    await job_repo.update_internal(job_id, update_data)
    
    total_reviews = 0
    reviews_scraped = 0
    
    
    try:
        # Initialize scraper
        scraper = GoogleMapsReviewScraper(
            driver_path=settings.CHROMEDRIVER_PATH,
            headless=True,
            verbose=True,
            timeout=10,
            original=True,
            language="en",
            concat_extra=False,
            log_file=f"job_{job_id}",
            extra_headers= ["--no-sandbox", "--disable-dev-shm-usage"]
        )
        
        # Connect to URL and get review count 
        total_reviews = await to_thread.run_sync(scraper.connect, job.url)
        logging.info(f"Total reviews found: {total_reviews}")    
        # Extract data
        if total_reviews > 0:
            data = await  to_thread.run_sync(scraper.extract_data,total_reviews)
            reviews_scraped = len(data)    
         
        else:
            # No reviews found
            reviews_scraped= 0
        
        status = "completed"
            
    except Exception as e:
        status = "failed"
        error = str(e)
    finally:
        
        update_data = JobUpdateInternal(
            status=status,
            end_time=datetime.now(timezone.utc),
            total_reviews=total_reviews,
            reviews_scraped=reviews_scraped,
            error=error if status == "failed" else None,
            reviews=data if status == "completed" else [],

        )
        
        await job_repo.update_internal(job_id, update_data)
        
        logging.info(f"Job {job_id} finished with status: {status}, error: {error if status == 'failed' else None}")
        
        try:
            scraper.exit(force=True)
        except:
            pass