import os
from typing import List
import httpx
from fastapi import APIRouter, HTTPException, status
from models.job import JobResponse, JobCreate, JobUpdate
from db.repositories.jobs import JobRepository
from core.config import settings

router = APIRouter(prefix="/jobs", tags=["jobs"])
SCRAPER_SERVICE_URL = settings.SCRAPER_SERVICE_URL
job_repo = JobRepository()


@router.post("/", response_model=JobResponse)
async def scrap_endpoint(job: JobCreate):
    """Endpoint to initiate a scraping job.
    This endpoint accepts job data and forwards it to the scraper service.
    The job data must include a 'source' field to determine the scraping service.
    """

    job_data = job.model_dump(mode="json", by_alias=True)
    print("Received job data:", job_data)
    if job_data.get("source_type") == "google":
        request_url = f"{SCRAPER_SERVICE_URL}/google/scrap"
    else:
        raise HTTPException(status_code=400, detail="Unsupported source")

    try:
        created_job = await job_repo.create(job)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            request_url, json=created_job.model_dump(mode="json", by_alias=True)
        )
        if response.status_code != 200:
            modified_job = await job_repo.update(
                created_job.id, {"status": "failed", "error": response.text}
            )
            raise HTTPException(status_code=response.status_code, detail=response.text)

        return JobResponse.model_validate(response.json())


@router.get("/", response_model=List[JobResponse])
async def list_jobs(skip: int = 0, limit: int = 100):
    """Endpoint to list all jobs.
    This endpoint retrieves a list of jobs from the database.
    """
    try:
        job_repo = JobRepository()
        jobs = await job_repo.get_all(skip=skip, limit=limit)
        return [
            JobResponse.model_validate(job.model_dump(by_alias=True)) for job in jobs
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve jobs: {str(e)}"
        )


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """Endpoint to retrieve a specific job by its ID.
    This endpoint fetches a job from the database using its ID.
    """
    try:
        job_repo = JobRepository()
        job = await job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return JobResponse.model_validate(job.model_dump(by_alias=True))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve job: {str(e)}")


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(job_id: str):
    """Endpoint to delete a job by its ID.
    This endpoint removes a job from the database using its ID.
    """
    try:
        job_repo = JobRepository()
        await job_repo.delete(job_id)
        return {"detail": "Job deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete job: {str(e)}")


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(job_id: str, job_data: JobUpdate):
    """Endpoint to update a job by its ID.
    This endpoint modifies an existing job in the database using its ID.
    """
    try:
        job_repo = JobRepository()
        updated_job = await job_repo.update(job_id, job_data)
        if not updated_job:
            raise HTTPException(status_code=404, detail="Job not found")
        return JobResponse.model_validate(updated_job.model_dump(by_alias=True))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update job: {str(e)}")


@router.get("/user/{user_id}", response_model=List[JobResponse])
async def get_jobs_by_user(user_id: str, skip: int = 0, limit: int = 100):
    """Endpoint to retrieve all jobs of a user.
    This endpoint fetches jobs associated with a specific user ID.
    """
    try:
        job_repo = JobRepository()
        jobs = await job_repo.get_by_user(user_id, skip=skip, limit=limit)
        return [
            JobResponse.model_validate(job.model_dump(by_alias=True)) for job in jobs
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve user's jobs: {str(e)}"
        )


@router.get("/business/{business_id}", response_model=List[JobResponse])
async def get_jobs_by_business(business_id: str, skip: int = 0, limit: int = 100):
    """Endpoint to retrieve all jobs of a business.
    This endpoint fetches jobs associated with a specific business ID.
    """
    try:
        job_repo = JobRepository()
        jobs = await job_repo.get_by_business(business_id, skip=skip, limit=limit)
        return [
            JobResponse.model_validate(job.model_dump(by_alias=True)) for job in jobs
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve business's jobs: {str(e)}"
        )


@router.get("/source/{source_id}", response_model=List[JobResponse])
async def get_jobs_by_source(source_id: str, skip: int = 0, limit: int = 100):
    """Endpoint to retrieve all jobs of a source.
    This endpoint fetches jobs associated with a specific source ID.
    """
    try:
        job_repo = JobRepository()
        jobs = await job_repo.get_by_source(source_id, skip=skip, limit=limit)
        return [
            JobResponse.model_validate(job.model_dump(by_alias=True)) for job in jobs
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve source's jobs: {str(e)}"
        )
