# backend/app/api/routers/jobs.py (SECURED VERSION)
import httpx
from api.dependencies import get_current_active_user
from core.config import settings
from db.repositories.jobs import JobRepository
from fastapi import APIRouter, Depends, HTTPException, status
from models.job import JobCreate, JobResponse, JobUpdate
from models.user import UserInDB

router = APIRouter(prefix="/jobs", tags=["jobs"])
SCRAPER_SERVICE_URL = settings.SCRAPER_SERVICE_URL
job_repo = JobRepository()


@router.post("/", response_model=JobResponse)
async def scrap_endpoint(
    job_data: dict, current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Endpoint to initiate a scraping job for the authenticated user.
    """
    try:
        # Create job with current user's ID
        job = JobCreate(
            name=job_data.get("name"),
            url=job_data["url"],
            user_id=str(current_user.id),
            business_id=job_data["business_id"],
            source_id=job_data["source_id"],
            source_type=job_data["source_type"],
        )

        job_data_processed = job.model_dump(mode="json", by_alias=True)
        print("Received job data:", job_data_processed)

        if job_data_processed.get("source_type") == "google":
            request_url = f"{SCRAPER_SERVICE_URL}/google/scrap"
        else:
            raise HTTPException(status_code=400, detail="Unsupported source")

        created_job = await job_repo.create(job)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create job: {e!s}")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            request_url, json=created_job.model_dump(mode="json", by_alias=True)
        )
        if response.status_code != 200:
            modified_job = await job_repo.update(
                str(created_job.job_id), {"status": "failed", "error": response.text}
            )
            raise HTTPException(status_code=response.status_code, detail=response.text)

        return JobResponse.model_validate(response.json())


@router.get("/", response_model=list[JobResponse])
async def list_user_jobs(
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """
    List jobs for the authenticated user only.
    """
    try:
        jobs = await job_repo.get_by_user(str(current_user.id), skip=skip, limit=limit)
        return [
            JobResponse.model_validate(job.model_dump(by_alias=True)) for job in jobs
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve jobs: {e!s}")


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str, current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Get a job by ID (only if user owns it).
    """
    try:
        job = await job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # Check if user owns this job
        if job.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this job",
            )

        return JobResponse.model_validate(job.model_dump(by_alias=False))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve job: {e!s}")


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: str, current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Delete a job by ID (only if user owns it).
    """
    try:
        # First check if job exists and user owns it
        job = await job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        if job.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this job",
            )

        await job_repo.delete(job_id)
        return

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete job: {e!s}")


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: str,
    job_data: JobUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """
    Update a job by ID (only if user owns it).
    """
    try:
        # First check if job exists and user owns it
        job = await job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        if job.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this job",
            )

        updated_job = await job_repo.update(job_id, job_data)
        return JobResponse.model_validate(updated_job.model_dump(by_alias=False))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update job: {e!s}")


@router.get("/business/{business_id}", response_model=list[JobResponse])
async def get_jobs_by_business(
    business_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """
    Get all jobs of a business (only if user owns the business).
    """
    try:
        jobs = await job_repo.get_by_business(business_id, skip=skip, limit=limit)

        # Filter to only include jobs owned by current user
        user_jobs = [job for job in jobs if job.user_id == current_user.id]

        return [
            JobResponse.model_validate(job.model_dump(by_alias=False))
            for job in user_jobs
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve business's jobs: {e!s}"
        )


@router.get("/source/{source_id}", response_model=list[JobResponse])
async def get_jobs_by_source(
    source_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """
    Get all jobs of a source (only if user owns the source).
    """
    try:
        jobs = await job_repo.get_by_source(source_id, skip=skip, limit=limit)

        # Filter to only include jobs owned by current user
        user_jobs = [job for job in jobs if job.user_id == current_user.id]

        return [
            JobResponse.model_validate(job.model_dump(by_alias=False))
            for job in user_jobs
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve source's jobs: {e!s}"
        )
