"""
CSV Services
Simple CSV file processing for reviews.
"""

import csv
import os
import tempfile
from datetime import datetime, timezone

from core.config import logger
from fastapi import HTTPException, UploadFile
from models.job import JobCreate, JobUpdateInternal
from models.review import ReviewCreate

ALLOWED_COLUMNS_NAMES = [
    "original_text",
    "translated_text",
    "date",
    "rating",
    "username",
]

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB


class CSVReader:
    """Service for reading CSV files containing reviews."""

    @staticmethod
    def read_csv(
        file_path: str,
        user_id: str,
        business_id: str,
        location_id: str,
        job_id: str,
    ) -> list[ReviewCreate]:
        """Read reviews from CSV file."""
        reviews = []

        with open(file_path, encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)

            if not reader.fieldnames:
                raise ValueError("CSV file has no headers")

            for row in reader:
                # Filter allowed columns and skip empty values
                data = {
                    k: v
                    for k, v in row.items()
                    if k in ALLOWED_COLUMNS_NAMES and v and v.strip()
                }

                if "original_text" not in data:
                    data["original_text"] = (
                        None  # Ensure original_text is always present
                    )

                if data:  # Skip empty rows
                    review = ReviewCreate(
                        user_id=user_id,
                        business_id=business_id,
                        location_id=location_id,
                        job_id=job_id,
                        data=data,
                        source_type="csv",
                        job_type="csv_upload",
                    )
                    reviews.append(review)

        if not reviews:
            raise ValueError("No valid data found in CSV")

        return reviews


async def process_csv_upload(
    csv_file: UploadFile,
    job_name: str,
    current_user,
    job_repo,
    review_repo,
    business_id: str,
    location_id: str | None = None,
) -> dict:
    """Process CSV upload workflow."""

    # Basic file validation
    if not csv_file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await csv_file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty")

    logger.info("aaaaaaaaaaaaaaaaaaaaaa 1")

    # Create job
    job = JobCreate(
        name=job_name,
        job_type="csv_upload",
        user_id=str(current_user.id),
        business_id=business_id,
        location_id=location_id,
    )

    logger.info("aaaaaaaaaaaaaaaaaaaaaa 4")
    created_job = await job_repo.create(job)

    logger.info("aaaaaaaaaaaaaaaaaaaaaa 5")

    # Save to temp file and process
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".csv")
    try:
        temp_file.write(content)
        temp_file.close()

        # Process CSV
        reviews = CSVReader.read_csv(
            file_path=temp_file.name,
            user_id=str(current_user.id),
            business_id=business_id,
            location_id=location_id,
            job_id=str(created_job.id),
        )

        logger.info(f"Read {len(reviews)} reviews from CSV")

        # Save reviews
        for review in reviews:
            await review_repo.create(review)

        # Update job with total reviews

        job_update_data = {
            "total_reviews": len(reviews),
            "reviews_handled": len(reviews),
            "status": "completed",
            "ended_at": datetime.now(timezone.utc),
        }
        await job_repo.update_internal(
            created_job.id, JobUpdateInternal(**job_update_data)
        )

        return {
            "success": True,
            "message": f"Processed {len(reviews)} reviews",
            "job_id": str(created_job.id),
            "reviews_count": len(reviews),
        }

    finally:
        # Cleanup
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
