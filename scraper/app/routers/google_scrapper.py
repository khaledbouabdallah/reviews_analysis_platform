from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import re
import dotenv
import os
import time

#from models.core import JobStatus, ScraperConfig
from models.job import JobResponse, JobCreate
from db.mongodb import db, jobs_collection
from scrapers.google_reviews.runner import run_scraper_job
from db.repositories.jobs import JobRepository

router = APIRouter()

job_repo = JobRepository()

# get environment variables
#dotenv.load_dotenv()

@router.post("/scrap", response_model=JobResponse)
async def start_scraping(job_data: JobCreate, background_tasks: BackgroundTasks):
    """
    Start a new scraping job.
    """
    # Prepare the job data (add job_id or other metadata if needed)
    job = await job_repo.create(job_data)
    #result = await jobs_collection.insert_one()

    # MongoDB returns the inserted_id
    #inserted_id = result.inserted_id

    # Start the job in the background
    background_tasks.add_task(run_scraper_job, str(job.job_id), job_data)

    # Optionally, reload the document to return a fully populated JobResponse
    return JobResponse.model_validate(job.model_dump(by_alias=True))





