from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import re
import dotenv
import os
import time

from models.core import JobStatus, ScraperConfig
from db.mongodb import db, jobs_collection
from scrapers.google_reviews.runner import run_scraper_job


router = APIRouter()

# get environment variables
dotenv.load_dotenv()

@router.post("/scrap", response_model=JobStatus)
async def start_scraping(config: ScraperConfig, background_tasks: BackgroundTasks):
    job_id = f"job_{int(time.time())}"
    
    # Initialize job status
    job = {
        "job_id": job_id,
        "status": "pending",
        "creation_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "start_time": None,
        "end_time": None,
        "total_reviews": None,
        "reviews_scraped": None,
        "error": None
    }
    
    jobs_collection.insert_one(job)
    
    # Start the job in the background
    background_tasks.add_task(run_scraper_job, job_id, config)
    
    return JobStatus(**job)





