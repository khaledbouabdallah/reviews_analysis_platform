# backend/app/services/segments.py
"""Business Segment Management Service

Provides high-level segment generation and classification functionality
using the LLM Agent Manager for efficient batch processing.
"""

from core.config import logger
from db.repositories.businesses import BusinessRepository
from db.repositories.reviews import ReviewRepository
from models.review import ReviewInDB
from services.llm_agents import llm_manager


class SegmentService:
    """Service for managing business review segments"""

    def __init__(self):
        self.business_repo = BusinessRepository()
        self.review_repo = ReviewRepository()
        self.segmentor = llm_manager.get_segmentor()

    async def generate_initial_segments(
        self,
        business_name: str,
        description: str = None,
        business_context: str = None,
        sample_reviews: list[str] = None,
    ) -> tuple[list[str], float]:
        """Generate initial segments for a business

        Args:
            business_name: Name of the business
            description: Optional business description
            business_context: Optional RAG-generated context from business documents
            sample_reviews: Optional sample reviews to inform segment generation

        Returns:
            Tuple[List[str], float]: (generated_segments, confidence_score)

        """
        try:
            logger.info(f"Generating segments for business: {business_name}")

            segments, confidence = await self.segmentor.generate_segments(
                business_name=business_name,
                description=description,
                business_context=business_context,
                sample_reviews=sample_reviews,
            )

            logger.info(
                f"Generated {len(segments)} segments with confidence {confidence}",
            )
            return segments, confidence

        except Exception as e:
            logger.error(f"Error generating segments for {business_name}: {e}")
            # Return fallback segments
            fallback_segments = [
                "service_quality",
                "value_for_money",
                "overall_experience",
                "cleanliness",
                "staff_friendliness",
            ]
            return fallback_segments, 0.3

    async def classify_review_batch(
        self,
        reviews: list[ReviewInDB],
        business_segments: list[str],
        batch_sizes: list[int] = [50, 25, 10, 5, 1],
    ) -> list[dict]:
        """Classify a batch of reviews into business segments

        Args:
            reviews: List of ReviewInDB objects to classify
            business_segments: Available segments for this business
            batch_sizes: Progressive fallback batch sizes

        Returns:
            List[Dict]: Classification results with segment data

        """
        if not reviews or not business_segments:
            logger.warning("No reviews or segments provided for classification")
            return []

        try:
            # Extract review texts for classification
            review_texts = []
            for review in reviews:
                # Use English translation if available, otherwise original
                text = review.data.get("comment", "")
                if not text:
                    text = review.data.get("original", "")
                review_texts.append(text)

            logger.info(
                f"Classifying {len(review_texts)} reviews into {len(business_segments)} segments",
            )

            # Perform batch classification
            classification_results = await self.segmentor.classify_reviews_batch(
                reviews=review_texts,
                available_segments=business_segments,
                batch_sizes=batch_sizes,
            )

            # Format results with review metadata
            formatted_results = []
            for i, (review, (matching_segments, confidences)) in enumerate(
                zip(reviews, classification_results, strict=False),
            ):
                result = {
                    "review_id": str(review.id),
                    "review_text": review_texts[i],
                    "matching_segments": matching_segments,
                    "segment_confidences": confidences,
                    "classification_success": bool(matching_segments),
                }
                formatted_results.append(result)

            successful_classifications = sum(
                1 for r in formatted_results if r["classification_success"]
            )
            logger.info(
                f"Successfully classified {successful_classifications}/{len(reviews)} reviews",
            )

            return formatted_results

        except Exception as e:
            logger.error(f"Error in batch review classification: {e}")
            # Return empty classifications for all reviews
            return [
                {
                    "review_id": str(review.id),
                    "review_text": "",
                    "matching_segments": [],
                    "segment_confidences": {},
                    "classification_success": False,
                }
                for review in reviews
            ]

    async def classify_single_review(
        self, review: ReviewInDB, business_segments: list[str],
    ) -> dict:
        """Classify a single review into business segments

        Args:
            review: ReviewInDB object to classify
            business_segments: Available segments for this business

        Returns:
            Dict: Classification result with segment data

        """
        try:
            # Extract review text
            text = review.data.get("comment", "") or review.data.get("original", "")

            if not text or not business_segments:
                return {
                    "review_id": str(review.id),
                    "review_text": text,
                    "matching_segments": [],
                    "segment_confidences": {},
                    "classification_success": False,
                }

            # Classify review
            (
                matching_segments,
                confidences,
            ) = await self.segmentor.classify_review_segments(
                review_text=text, available_segments=business_segments,
            )

            return {
                "review_id": str(review.id),
                "review_text": text,
                "matching_segments": matching_segments,
                "segment_confidences": confidences,
                "classification_success": bool(matching_segments),
            }

        except Exception as e:
            logger.error(f"Error classifying review {review.id}: {e}")
            return {
                "review_id": str(review.id),
                "review_text": "",
                "matching_segments": [],
                "segment_confidences": {},
                "classification_success": False,
            }

    async def update_review_segments(self, review_id: str, segment_data: dict) -> bool:
        """Update a review's processed data with segment classification

        Args:
            review_id: ID of the review to update
            segment_data: Segment classification data

        Returns:
            bool: Success status

        """
        try:
            # Prepare processed data update
            processed_update = {
                "segments": segment_data["matching_segments"],
                "segment_confidences": segment_data["segment_confidences"],
                "segment_classification_success": segment_data[
                    "classification_success"
                ],
            }

            # Update review in database
            await self.review_repo.update_processed_data(review_id, processed_update)

            logger.debug(f"Updated segments for review {review_id}")
            return True

        except Exception as e:
            logger.error(f"Error updating segments for review {review_id}: {e}")
            return False

    async def get_business_segment_analytics(
        self, business_id: str, business_segments: list[str],
    ) -> dict:
        """Get segment analytics for a business

        Args:
            business_id: ID of the business
            business_segments: Business segments to analyze

        Returns:
            Dict: Segment analytics and insights

        """
        try:
            # Get all reviews for business
            reviews = await self.review_repo.get_by_business(business_id)

            if not reviews:
                return {
                    "total_reviews": 0,
                    "classified_reviews": 0,
                    "segment_distribution": {},
                    "average_confidences": {},
                    "top_segments": [],
                }

            # Analyze segment distribution
            segment_counts = dict.fromkeys(business_segments, 0)
            segment_confidence_sums = dict.fromkeys(business_segments, 0.0)
            classified_count = 0

            for review in reviews:
                if hasattr(review, "processed_data") and review.processed_data:
                    review_segments = getattr(review.processed_data, "segments", [])
                    confidences = getattr(
                        review.processed_data, "segment_confidences", {},
                    )

                    if review_segments:
                        classified_count += 1

                        for segment in review_segments:
                            if segment in segment_counts:
                                segment_counts[segment] += 1
                                segment_confidence_sums[segment] += confidences.get(
                                    segment, 0.0,
                                )

            # Calculate averages and top segments
            average_confidences = {}
            for segment in business_segments:
                count = segment_counts[segment]
                if count > 0:
                    average_confidences[segment] = (
                        segment_confidence_sums[segment] / count
                    )
                else:
                    average_confidences[segment] = 0.0

            # Sort segments by frequency
            top_segments = sorted(
                segment_counts.items(), key=lambda x: x[1], reverse=True,
            )[:5]

            return {
                "total_reviews": len(reviews),
                "classified_reviews": classified_count,
                "segment_distribution": segment_counts,
                "average_confidences": average_confidences,
                "top_segments": top_segments,
            }

        except Exception as e:
            logger.error(
                f"Error getting segment analytics for business {business_id}: {e}",
            )
            return {
                "total_reviews": 0,
                "classified_reviews": 0,
                "segment_distribution": {},
                "average_confidences": {},
                "top_segments": [],
            }

    # TODO: Premium Features
    async def refine_segments_based_on_reviews(
        self,
        business_id: str,
        current_segments: list[str],
        recent_reviews: list[ReviewInDB],
    ) -> tuple[list[str], float]:
        """TODO: Premium feature - Refine segments based on new review patterns

        Args:
            business_id: Business ID
            current_segments: Current business segments
            recent_reviews: Recent reviews to analyze

        Returns:
            Tuple[List[str], float]: (refined_segments, confidence)

        """
        # TODO: Implement segment refinement logic
        # - Analyze review patterns
        # - Suggest new segments or modifications
        # - Return updated segment list

    async def suggest_segment_improvements(
        self, business_id: str, performance_data: dict,
    ) -> list[dict]:
        """TODO: Premium feature - Suggest segment improvements based on analytics

        Args:
            business_id: Business ID
            performance_data: Business performance metrics

        Returns:
            List[Dict]: Improvement suggestions

        """
        # TODO: Implement improvement suggestions
        # - Analyze low-performing segments
        # - Suggest actionable improvements
        # - Provide benchmarking data

    async def compare_segments_across_businesses(self, business_ids: list[str]) -> dict:
        """TODO: Premium feature - Compare segments across multiple businesses

        Args:
            business_ids: List of business IDs to compare

        Returns:
            Dict: Comparative segment analysis

        """
        # TODO: Implement cross-business comparison
        # - Compare segment performance
        # - Identify best practices
        # - Provide competitive insights


# Global service instance
segment_service = SegmentService()
