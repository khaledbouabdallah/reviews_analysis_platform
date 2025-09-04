# backend/app/api/routers/jobs.py (CELERY VERSION)
import httpx
from api.dependencies import get_current_active_user
from celery.result import AsyncResult
from celery_app import celery_app
from core.config import logger, settings
from db.repositories import JobRepository, ReviewRepository, SourceRepository
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from models.job import JobCreate, JobResponse, JobUpdate, JobUpdateInternal
from models.user import UserInDB
from services.csv_services import process_csv_upload
from services.subscription_service import subscription_service

router = APIRouter(prefix="/jobs", tags=["jobs"])
job_repo = JobRepository()
source_repo = SourceRepository()
review_repo = ReviewRepository()


@router.post("/load_csv", response_model=dict)
async def load_csv_endpoint(
    csv_file: UploadFile = File(...),
    business_id: str = Form(...),
    location_id: str | None = Form(None),
    job_name: str | None = Form(None),
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Endpoint to load CSV data for the authenticated user."""

    return await process_csv_upload(
        csv_file=csv_file,
        job_name=job_name,
        current_user=current_user,
        job_repo=job_repo,
        review_repo=review_repo,
        business_id=business_id,
        location_id=location_id,
    )


@router.post("/", response_model=dict)
async def scrap_endpoint(
    job_data: dict,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Endpoint to initiate a scraping job for the authenticated user."""
    try:
        # find source by Id
        logger.info(f"Received scraping job data: {job_data}")
        source = await source_repo.get_by_id(job_data["source_id"])
        if not source:
            raise HTTPException(status_code=404, detail="Source not found")

        # Create job with current user's ID
        job = JobCreate(
            name=job_data.get("name"),
            job_type="scraping",
            url=source.url,
            user_id=str(current_user.id),
            business_id=job_data["business_id"],
            location_id=job_data.get("location_id"),
            source_id=job_data["source_id"],
            source_type=job_data["source_type"],
        )

        job_data_processed = job.model_dump(mode="json", by_alias=True)

        logger.info(f"Creating scrap job for user {current_user.id}: {job_data_processed}")

        # Check source type support
        if job_data_processed.get("source_type") != "google":
            raise HTTPException(status_code=400, detail="Unsupported source type")

        # Create job in database
        created_job = await job_repo.create(job)
        job_id = str(created_job.id)

        # Get limit and usage to block if surpass allowed usage
        get_current_usage = await subscription_service.get_current_usage(str(current_user.id))
        reviews_used, reviews_limit = get_current_usage.reviews_used, get_current_usage.reviews_limit

        logger.info(f"User {current_user.id} has used {reviews_used}/{reviews_limit} reviews")
        # Queue Celery task instead of HTTP call
        task = celery_app.send_task(
            "celery_tasks.scraper_task",
            args=[job_id, job_data_processed, reviews_used, reviews_limit],
            queue="scraping",
        )
        
        job_update_internal = JobUpdateInternal(**{"task_id": task.id})
        await job_repo.update_internal(job_id, job_update_internal)
        
        # make http request to scraper service to force cloud run to start the service

        try:
            logger.warning(
                f"Sending wake-up call to scraper service for job {job_id} at {settings.SCRAPER_SERVICE_URL}/health"
            )
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.get(settings.SCRAPER_SERVICE_URL + "/health")
            logger.info(
                f"Scraper service wake-up call sent for job {job_id} to {settings.SCRAPER_SERVICE_URL}"
            )
        except Exception as wake_error:
            # Don't fail the job if wake-up fails - job is already queued
            logger.warning(f"Wake-up call failed (job still queued): {wake_error}")

        # Return task information

        logger.info(f"Job {job_id} created and task {task.id} queued successfully")
        return {
            "id": job_id,
            "task_id": task.id,
            "status": "queued",
            "message": "Scraping job queued successfully",
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create job: {e!s}")
        raise HTTPException(status_code=500, detail=f"Failed to create job: {e!s}")


@router.get("/", response_model=list[JobResponse])
async def list_user_jobs(
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """List jobs for the authenticated user only."""
    try:
        jobs = await job_repo.get_by_user(str(current_user.id), skip=skip, limit=limit)
        return [
            JobResponse.model_validate(job.model_dump(by_alias=False)) for job in jobs
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve jobs: {e!s}")


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Get a job by ID (only if user owns it)."""
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


@router.get("/{job_id}/status", response_model=dict)
async def get_job_status(
    job_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Get detailed job status including Celery task information."""
    try:
        # Get job from database
        job = await job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # Check if user owns this job
        if job.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this job",
            )

        # Return job status
        return {
            "id": job_id,
            "status": job.status,
            "total_reviews": job.total_reviews,
            "reviews_handled": job.reviews_handled,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "ended_at": job.ended_at.isoformat() if job.ended_at else None,
            "error": job.error,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get job status: {e!s}")


@router.get("/tasks/{task_id}/status", response_model=dict)
async def get_task_status(
    task_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Get Celery task status by task ID."""
    try:
        result = AsyncResult(task_id, app=celery_app)

        if result.state == "PENDING":
            response = {
                "task_id": task_id,
                "state": result.state,
                "status": "Task is waiting to be processed",
            }
        elif result.state == "PROGRESS":
            response = {"task_id": task_id, "state": result.state, **result.info}
        elif result.state == "SUCCESS":
            response = {
                "task_id": task_id,
                "state": result.state,
                "result": result.result,
            }
        else:  # FAILURE, REVOKED, etc.
            response = {
                "task_id": task_id,
                "state": result.state,
                "error": str(result.info) if result.info else "Unknown error",
            }

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get task status: {e!s}")


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Delete a job by ID (only if user owns it)."""
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


@router.delete("/{job_id}/cancel", response_model=dict)
async def cancel_job(
    job_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Cancel a running job by ID (only if user owns it)."""
    try:
        # First check if job exists and user owns it
        job = await job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        if job.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to cancel this job",
            )

        # Check if job is in a cancellable state
        if job.status in ["completed", "failed", "canceled"]:
            raise HTTPException(
                status_code=400,
                detail=f"Job cannot be canceled - current status: {job.status}",
            )
        
        # remove task for redis queue
        task_id = job.task_id
        celery_app.control.revoke(task_id, terminate=False)
        logger.info(f"removed {task_id} for queue")
        
        # Update job status to 'cancelling' to signal worker
        job_update = JobUpdateInternal(status="canceled")
        await job_repo.update_internal(job_id, job_update)
        
        return {
            "id": job_id,
            "message": "Job cancellation requested",
            "cancelled": True,
        }

    except HTTPException:
        logger.error(f"Failed to cancel job {job_id}: {e!s}")
        raise
    except Exception as e:
        logger.error(f"Failed to cancel job {job_id}: {e!s}")   
        raise HTTPException(status_code=500, detail=f"Failed to cancel job: {e!s}")


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: str,
    job_data: JobUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Update a job by ID (only if user owns it)."""
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
    """Get all jobs of a business (only if user owns the business)."""
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
            status_code=500,
            detail=f"Failed to retrieve business's jobs: {e!s}",
        )


@router.get("/source/{source_id}", response_model=list[JobResponse])
async def get_jobs_by_source(
    source_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Get all jobs of a source (only if user owns the source)."""
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
            status_code=500,
            detail=f"Failed to retrieve source's jobs: {e!s}",
        )
