import os

from celery import Celery

# Get Redis URL from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "reviews_scraper",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["celery_tasks"],  # Import tasks module
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Worker settings
    worker_prefetch_multiplier=1,  # One job at a time per worker
    task_acks_late=True,  # Acknowledge task after completion
    worker_max_tasks_per_child=10,  # Restart worker after 10 tasks (prevents memory leaks)
    # Task routing
    task_routes={
        "celery_tasks.scraper_task": {"queue": "scraping"},
        "celery_tasks.cancel_job_task": {"queue": "management"},
    },
    # Task time limits
    task_soft_time_limit=3600,  # 1 hour soft limit
    task_time_limit=3900,  # 1 hour 5 minutes hard limit
    # Result expiration
    result_expires=3600 * 24,  # Results expire after 24 hours
    # Retry settings
    task_default_retry_delay=60,  # Retry after 60 seconds
    task_max_retries=3,  # Maximum 3 retries
)
