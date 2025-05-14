
from datetime import datetime, timezone
from models.core import JobStatus, ScraperConfig
from db.mongodb import db, jobs_collection
from services.db_utils import save_reviews_to_mongodb
from scrapers.google_reviews.google_reviews_scrapper import GoogleMapsReviewScraper
from anyio import to_thread
from core.config import settings
import logging
logging.basicConfig(level=logging.INFO)


async def run_scraper_job(job_id: str, config: ScraperConfig):
    
    logging.info(f"Starting scraping job {job_id} with config: {config}")
    await jobs_collection.update_one({"job_id": job_id}, {"$set": {"status": "running", "started_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}})
    
    total_reviews = 0
    reviews_scraped = 0
    
    
    try:
        # Initialize scraper
        scraper = GoogleMapsReviewScraper(
            driver_path=settings.CHROMEDRIVER_PATH,
            headless=config.headless,
            verbose=True,
            timeout=config.timeout,
            original=config.original,
            language=config.language,
            concat_extra=config.concat_extra,
            log_file=f"job_{job_id}",
            extra_headers= ["--no-sandbox", "--disable-dev-shm-usage"]
        )
        
        # Connect to URL and get review count 
        total_reviews = await to_thread.run_sync(scraper.connect, config.url)
        logging.info(f"Total reviews found: {total_reviews}")    
        # Extract data
        if total_reviews > 0:
            data = await  to_thread.run_sync(scraper.extract_data,total_reviews)
            reviews_scraped = len(data)    
            # Save to MongoDB
            await save_reviews_to_mongodb(data, job_id, config.url)
            reviews_scraped = len(data)            
        else:
            # No revie
            reviews_scraped= 0
        
        status = "completed"
            
    except Exception as e:
        status = "failed"
        error = str(e)
    finally:
        end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        await jobs_collection.update_one({"job_id": job_id},
                                         {"$set": 
                                             {"status": status, "total_reviews": total_reviews, 
                                              "reviews_scraped": reviews_scraped if status == "completed" else None ,
                                              "end_time": end_time, "error": error if status == "failed" else None}})
        
        logging.info(f"Job {job_id} finished with status: {status}, error: {error if status == 'failed' else None}")
        
        try:
            scraper.exit(force=True)
        except:
            pass