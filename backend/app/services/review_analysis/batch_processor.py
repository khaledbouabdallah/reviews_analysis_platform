# backend/app/services/analysis/batch_processor.py

import asyncio
from datetime import datetime, timezone

from core.config import logger
from db.repositories.jobs import JobRepository
from db.repositories.reviews import ReviewRepository
from models.analysis_requests import ReviewInput
from models.analysis_schemas import AnalysisTask
from models.job import JobCreate, JobUpdateInternal
from models.review import ReviewInDB
from services.review_analysis.review_analyzer import review_analyzer


class BatchProcessor:
    """Handles batch processing of reviews with retry logic and progress tracking."""

    def __init__(self, reviews: list[ReviewInDB], user_id: str):
        self.job_repo = JobRepository()
        self.review_repo = ReviewRepository()
        self.batch_sizes = [100, 50, 20]  # Only 3 sizes as you specified
        self.max_retries = 3
        self.reviews = reviews
        self.user_id = user_id
        self.review_inputs = self._convert_to_review_inputs(reviews)

    async def process_all_reviews(
        self,
        tasks: list[AnalysisTask],
        target_topics: list[str] = None,
        business_context: str = None,
    ) -> dict:
        """Process all reviews with batch processing and retry logic."""

        try:
            # Create analysis job at the beginning

            logger.info(
                f"Creating analysis job, analysis for {len(self.review_inputs)} reviews"
            )

            analysis_job = JobCreate(
                name=None,  # Auto-generated later
                job_type="analysis",
                user_id=self.user_id,
                business_id=self.reviews[
                    0
                ].business_id,  # Use business_id from first review
                source_id=self.reviews[0].source_id,  # Use source_id from first review
                location_id=self.reviews[0].location_id
                if self.reviews[0].location_id
                else None,
            )

            created_job = await self.job_repo.create(analysis_job)
            analysis_job_id = str(created_job.id)

            # Update job status to running
            await self._update_job_status(
                analysis_job_id, "running", started_at=datetime.now(timezone.utc)
            )

            if not self.review_inputs:
                await self._update_job_status(
                    analysis_job_id, "failed", error="No valid reviews found"
                )
                return {
                    "success": False,
                    "error": "No valid reviews found",
                    "job_id": analysis_job_id,
                }

            # Update total count
            await self._update_job_progress(
                analysis_job_id, total_reviews=len(self.review_inputs)
            )

            logger.info(
                f"Starting batch processing for analysis job {analysis_job_id} with {len(self.review_inputs)} reviews"
            )

            # Process in batches with the original job_id for context
            processed_count = 0
            failed_count = 0

            for batch_start in range(0, len(self.review_inputs), self.batch_sizes[0]):
                batch_end = min(
                    batch_start + self.batch_sizes[0], len(self.review_inputs)
                )
                batch = self.review_inputs[batch_start:batch_end]
                original_batch = self.reviews[batch_start:batch_end]

                logger.info(
                    f"Processing batch {batch_start}-{batch_end} for analysis job {analysis_job_id}"
                )

                # Try processing this batch with retry logic
                batch_result = await self._process_batch_with_retry(
                    batch, tasks, target_topics, business_context
                )

                if batch_result["success"]:
                    # Update individual reviews with analysis results
                    await self._save_batch_results(
                        original_batch, batch_result["analysis"]
                    )
                    processed_count += len(batch)
                    logger.info(
                        f"Successfully processed batch {batch_start}-{batch_end}"
                    )
                else:
                    failed_count += len(batch)
                    logger.error(
                        f"Failed to process batch {batch_start}-{batch_end}: {batch_result['error']}"
                    )

                # Update job progress
                await self._update_job_progress(
                    analysis_job_id, reviews_handled=processed_count
                )

                # Small delay between batches to avoid rate limiting
                await asyncio.sleep(1)

            # Final job status update
            if processed_count == len(self.review_inputs):
                await self._update_job_status(
                    analysis_job_id, "completed", ended_at=datetime.now(timezone.utc)
                )
                status = "completed"
            elif processed_count > 0:
                await self._update_job_status(
                    analysis_job_id,
                    "partially_completed",
                    ended_at=datetime.now(timezone.utc),
                )
                status = "partially_completed"
            else:
                await self._update_job_status(
                    analysis_job_id,
                    "failed",
                    error="All batches failed",
                    ended_at=datetime.now(timezone.utc),
                )
                status = "failed"

            return {
                "success": processed_count > 0,
                "status": status,
                "total_reviews": len(self.review_inputs),
                "processed_count": processed_count,
                "failed_count": failed_count,
                "job_id": analysis_job_id,
            }

        except Exception as e:
            logger.error(f"Error in batch processing: {e}")
            if "analysis_job_id" in locals():
                await self._update_job_status(
                    analysis_job_id,
                    "failed",
                    error=str(e),
                    ended_at=datetime.now(timezone.utc),
                )
                return {"success": False, "error": str(e), "job_id": analysis_job_id}
            return {"success": False, "error": str(e)}

    async def _process_batch_with_retry(
        self,
        batch: list[ReviewInput],
        tasks: list[AnalysisTask],
        target_topics: list[str] = None,
        business_context: str = None,
    ) -> dict:
        """Process a batch: try 100 -> 50 -> 20, stop if 20 fails."""

        for batch_size in self.batch_sizes:  # [100, 50, 20]
            # Split batch if it's larger than current batch_size
            if len(batch) <= batch_size:
                # Try this batch size once
                try:
                    logger.info(
                        f"Trying batch of {len(batch)} reviews with max size {batch_size}"
                    )

                    result = await review_analyzer.analyze(
                        reviews=batch,
                        user_id=self.user_id,
                        tasks=tasks,
                        target_topics=target_topics,
                        business_context=business_context,
                    )

                    if result["success"]:
                        logger.info(f"Batch succeeded with size {batch_size}")
                        return {"success": True, "analysis": result["analysis"]}
                    logger.warning(f"Batch size {batch_size} failed: {result['error']}")

                except Exception as e:
                    logger.error(f"Exception with batch size {batch_size}: {e}")

            else:
                # Batch too large, split and process chunks
                logger.info(
                    f"Splitting batch of {len(batch)} into chunks of {batch_size}"
                )
                all_results = []

                for i in range(0, len(batch), batch_size):
                    chunk = batch[i : i + batch_size]

                    try:
                        result = await review_analyzer.analyze(
                            reviews=chunk,
                            user_id=self.user_id,
                            tasks=tasks,
                            target_topics=target_topics,
                            business_context=business_context,
                        )

                        if result["success"]:
                            # Collect results from this chunk
                            chunk_results = (
                                result["analysis"].results
                                if hasattr(result["analysis"], "results")
                                else [result["analysis"]]
                            )
                            all_results.extend(chunk_results)
                            logger.info(f"Chunk {i // batch_size + 1} succeeded")
                        else:
                            logger.error(
                                f"Chunk {i // batch_size + 1} failed: {result['error']}"
                            )
                            break  # Try next smaller batch size

                    except Exception as e:
                        logger.error(f"Exception in chunk {i // batch_size + 1}: {e}")
                        break  # Try next smaller batch size
                else:
                    # All chunks succeeded
                    logger.info(f"All chunks succeeded with batch size {batch_size}")
                    return {"success": True, "analysis": all_results}

        # All batch sizes failed
        return {"success": False, "error": "All batch sizes (100, 50, 20) failed"}

    def _convert_to_review_inputs(
        self, reviews: list[ReviewInDB] | ReviewInDB
    ) -> list[ReviewInput]:
        """Convert ReviewInDB objects to ReviewInput objects for analysis."""
        review_inputs = []

        if isinstance(reviews, ReviewInDB):
            reviews = [reviews]

        for review in reviews:
            # Extract text from review data
            text = (
                review.data.get("comment")
                or review.data.get("original_text")
                or review.data.get("text", "")
            )

            if text:
                review_input = ReviewInput(
                    text=text,
                    rating=review.data.get("rating"),
                    business_type=review.data.get("business_type"),
                    source=review.source_type,
                    metadata={"review_id": str(review.id)},
                )
                review_inputs.append(review_input)

        return review_inputs

    async def _save_batch_results(
        self, reviews: list[ReviewInDB], analysis_results
    ) -> None:
        """Save analysis results back to individual review records."""

        # Handle different result formats
        if hasattr(analysis_results, "results"):
            # Batch format
            results_list = analysis_results.results
        elif isinstance(analysis_results, list):
            results_list = analysis_results
        else:
            # Single result
            results_list = [analysis_results]

        for i, review in enumerate(reviews):
            if i < len(results_list):
                try:
                    # Convert analysis result to dict for storage
                    analysis_dict = (
                        results_list[i].model_dump()
                        if hasattr(results_list[i], "model_dump")
                        else results_list[i]
                    )

                    # Update review analyzed_data
                    analyzed_data = {
                        "analysis_results": analysis_dict,
                        "processing_status": "completed",
                        "processed_at": datetime.now(timezone.utc),
                    }

                    await self.review_repo.update_processed_data(
                        str(review.id), analyzed_data
                    )

                except Exception as e:
                    logger.error(
                        f"Error saving analysis result for review {review.id}: {e}"
                    )

    async def _update_job_status(self, job_id: str, status: str, **kwargs) -> None:
        """Update job status and other fields."""
        try:
            logger.info("yesssssssssss")
            update_data = JobUpdateInternal(status=status, **kwargs)
            logger.info("got you bitch")
            await self.job_repo.update_internal(job_id, update_data)
        except Exception as e:
            logger.error(f"Error updating job status for job {job_id}: {e}")

    async def _update_job_progress(self, job_id: str, **kwargs) -> None:
        """Update job progress fields."""
        try:
            logger.info("noooooooooooooooooooo")
            update_data = JobUpdateInternal(**kwargs)
            logger.info("got you bitchhhhhhhhhhhhhh 2")
            await self.job_repo.update_internal(job_id, update_data)
        except Exception as e:
            logger.error(f"Error updating job progress for job {job_id}: {e}")
