import os

from celery import Celery

# Get Redis URL from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "reviews_scraper",
    broker=REDIS_URL,
    backend=REDIS_URL,
    # Backend doesn't include tasks - it only calls them
)

# Same configuration as scraper
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=10,
    task_routes={
        "celery_tasks.scraper_task": {"queue": "scraping"},
        "celery_tasks.cancel_job_task": {"queue": "management"},
    },
    task_soft_time_limit=3600,
    task_time_limit=3900,
    result_expires=3600 * 24,
    task_default_retry_delay=60,
    task_max_retries=3,
)
