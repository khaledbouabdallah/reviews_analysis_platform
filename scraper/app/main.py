from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
import os
import logging
import time
from datetime import datetime
import re


# Import the scraper class
from .google_reviews_scrapper import GoogleMapsReviewScraper

app = FastAPI(title="Google Maps Review Scraper API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create data directory if it doesn't exist
os.makedirs("data", exist_ok=True)
os.makedirs("logs", exist_ok=True)

# In-memory job storage - In production, use a database
jobs = {}

class ScraperConfig(BaseModel):
    url: str
    headless: bool = True
    timeout: int = 10
    original: bool = True
    language: str = "en"
    concat_extra: bool = False
    path: str = "data"
    name: str = "reviews"
    timestamp: bool = True
    
    @field_validator('url')
    def validate_google_maps_url(cls, v):
        # Pattern to match Google Maps URLs
        
        
        google_maps_pattern = r'^https?://(www\.)?(google\.[a-z]{2,3}(/maps)?|maps\.google\.[a-z]{2,3})/.+$'
        
        if not re.match(google_maps_pattern, v):
            raise ValueError("URL must be a valid Google Maps link")
        
        # Method 1: Check for !4m18 or !4m8 parameter (most reliable)
        if re.search(r'!4m(18|8)\!', v):
            return v

        # Method 2: Check for !3m7 parameter (also reliable)
        if re.search(r'!3m7!', v):
            return v

        # Method 3: Count !9m1!1b1 occurrences (less reliable but can be used as backup)
        if v.count('!9m1!1b1') >= 2:
            return v

        raise ValueError("URL must contain a valid Google Maps reviews section")


class JobStatus(BaseModel):
    job_id: str
    status: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    total_reviews: Optional[int] = None
    reviews_scraped: Optional[int] = None
    file_path: Optional[str] = None 
    error: Optional[str] = None

# Helper function to get the path of the chromedriver TODO: use environment variable
def get_driver_path():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    scraper_dir = os.path.dirname(script_dir)
    chromedriver_path = os.path.join(scraper_dir, "Driver", "chromedriver")
    return chromedriver_path

def run_scraper_job(job_id: str, config: ScraperConfig):
    jobs[job_id]["status"] = "running"
    jobs[job_id]["start_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    try:
        # Initialize scraper
        scraper = GoogleMapsReviewScraper(
            driver_path=get_driver_path(),
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
        total_reviews = scraper.connect(config.url)
        jobs[job_id]["total_reviews"] = total_reviews
        
        # Extract data
        if total_reviews > 0:
            data = scraper.extract_data(total_reviews)
            jobs[job_id]["reviews_scraped"] = len(data)
            
            # Save data
            timestamp_str = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            file_name = f"{config.name}_{timestamp_str}" if config.timestamp else config.name
            scraper.save_data(
                data=data, 
                path=config.path, 
                name=file_name, 
                timestamp=False  # We've already added timestamp to the name
            )
            
            file_ext = "csv" if config.concat_extra else "json"
            file_path = f"{config.path}/{file_name}.{file_ext}"
            jobs[job_id]["file_path"] = file_path
            jobs[job_id]["status"] = "completed"
        else:
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["reviews_scraped"] = 0
            
    except Exception as e:
        logger.error(f"Job {job_id} failed: {str(e)}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
    finally:
        jobs[job_id]["end_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        try:
            scraper.exit(force=True)
        except:
            pass


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {"message": "Google Maps Review Scraper API. See /docs for documentation."}

@app.post("/scrape", response_model=JobStatus)
async def start_scraping(config: ScraperConfig, background_tasks: BackgroundTasks):
    job_id = f"job_{int(time.time())}"
    
    # Initialize job status
    jobs[job_id] = {
        "job_id": job_id,
        "status": "pending",
        "start_time": None,
        "end_time": None,
        "total_reviews": None,
        "reviews_scraped": None,
        "file_path": None,
        "error": None
    }
    
    # Start the job in the background
    background_tasks.add_task(run_scraper_job, job_id, config)
    
    return JobStatus(**jobs[job_id])

@app.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobStatus(**jobs[job_id])

@app.get("/jobs", response_model=List[JobStatus])
async def list_jobs():
    return [JobStatus(**job) for job in jobs.values()]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)