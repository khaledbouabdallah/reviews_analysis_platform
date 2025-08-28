import os
from urllib.parse import urlparse, urlunparse

from celery import Celery

# Get Redis URL from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


# Add SSL cert requirements for rediss:// URLs
def configure_redis_url(url):
    if url.startswith("rediss://"):
        parsed = urlparse(url)
        # Add ssl_cert_reqs=CERT_NONE if not present
        if "ssl_cert_reqs" not in url:
            separator = "&" if parsed.query else ""
            query = f"{parsed.query}{separator}ssl_cert_reqs=CERT_NONE"
            return urlunparse(parsed._replace(query=query))
    return url


# Configure Redis URL
configured_redis_url = configure_redis_url(REDIS_URL)

# Create Celery app
celery_app = Celery(
    "reviews_scraper",
    broker=configured_redis_url,
    backend=configured_redis_url,
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
    },
    task_soft_time_limit=3600,
    task_time_limit=3900,
    result_expires=3600 * 24,
    task_default_retry_delay=60,
    task_max_retries=1,
)
