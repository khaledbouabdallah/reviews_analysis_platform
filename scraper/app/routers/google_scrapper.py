
from db.repositories.jobs import JobRepository
from fastapi import APIRouter, BackgroundTasks, HTTPException, status

# from models.core import JobStatus, ScraperConfig
from models.job import JobInDB, JobResponse
from scrapers.google_reviews.runner import run_scraper_job

router = APIRouter()

job_repo = JobRepository()

# get environment variables
# dotenv.load_dotenv()


@router.post("/scrap", response_model=JobResponse)
async def start_scraping(job_data: JobInDB, background_tasks: BackgroundTasks):
    """
    Start a new scraping job.
    """
    try:
        background_tasks.add_task(run_scraper_job, str(job_data.job_id), job_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )

    # Optionally, reload the document to return a fully populated JobResponse
    return JobResponse.model_validate(job_data.model_dump(by_alias=True))
