from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import re
from db.mongodb import db, jobs_collection
from models.core import JobStatus

router = APIRouter()

@router.get("/")
async def root():
    """Root endpoint with API information."""
    return {"message": "Google Maps Review Scraper API. See /docs for documentation."}

@router.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    job = await jobs_collection.find_one({"job_id": job_id})
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatus(**job)

@router.get("/jobs", response_model=List[JobStatus])
async def list_jobs():
    return await jobs_collection.find().to_list(length=100)


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(job_id: str):
    result = await jobs_collection.delete_one({"job_id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job deleted successfully"}


@router.delete("/jobs", status_code=status.HTTP_200_OK)
async def delete_all_jobs():
    result = await jobs_collection.delete_many({})
    return {"message": f"{result.deleted_count} jobs deleted successfully"}