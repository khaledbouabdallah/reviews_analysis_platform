# backend/app/services/review_service.py
"""
Enhanced review service that automatically processes reviews when created.
"""

from typing import Dict, Any, List
from db.repositories.reviews import ReviewRepository
from models.review import ReviewCreate, ReviewInDB
from services.cleaner import preprocess_comment
from services.language import detect_language
from services.sentiment import SentimentAnalyzer
from core.config import logger
from datetime import datetime, timezone


class BasicAnalyzer:
    """Service for creating and managing reviews with automatic processing."""
    
    def __init__(self):
        self.review_repo = ReviewRepository()
        self.sentiment_analyzer = SentimentAnalyzer()
    
    
    async def batch_simple_analyze(self, reviews: List[ReviewInDB]) -> List[ReviewInDB]:
        """
        Process a batch of reviews for sentiment and language detection.
        
        Args:
            reviews: List of reviews to process
        Returns:
            List of booleans indicating success for each review
        """
        results = []
        for review in reviews:
            if not self._is_review_processed(review):
                result = await self.simple_analyze(review)
                results.append(result)
            else:
                logger.debug(f"Review {review.id} already processed, skipping.")
                results.append(review)
        return results
    
    
    async def simple_analyze(self, review: ReviewInDB) -> ReviewInDB:
        """
        Automatically process a review for sentiment and language detection.
        
        Args:
            review: Review to process
        """
        try:
            # Extract text from review data
            text = review.data.get('original', None)
            
            if not text:
                # failed # Mark as failed if no original text found
                await self._mark_processing_failed(review.id, "No original text found")
                return review
            
            # Clean the text
            cleaned_text = preprocess_comment(text)
            
            # translate to English if necessary
            detected_language = detect_language(cleaned_text)
            # workaround for now, use google maps transaltion
            translated_text = review.data.get('comment', None)
            translated_text = preprocess_comment(translated_text)
                        
            # Analyze sentiment of english text
            sentiment_result = self.sentiment_analyzer.analyze(translated_text, "en")
            
            # TODO: classify by importance, segmentation, etc. or add it to more advanced analyzer (money maker :) )
            
            # Prepare processed data
            processed_data = {
                "cleaned_text": cleaned_text,
                "translated_text": translated_text,
                "detected_language": detected_language,
                "sentiment": sentiment_result,
                "processing_status": "completed",
                "processed_at": datetime.now(timezone.utc)
            }
            
            # Update review with processed data
            updated_review = await self.review_repo.update_processed_data(str(review.id), processed_data)
            logger.debug(f"Successfully processed review {review.id}")
            return updated_review
            
        except Exception as e:
            logger.error(f"Error processing review {review.id}: {str(e)}")
            await self._mark_processing_failed(review.id, str(e))
    
    async def _mark_processing_failed(self, review_id: str, error_message: str) -> None:
        """Mark a review as failed processing."""
        try:
            failed_data = {
                "processing_status": "failed",
                "error_message": error_message,
                "processed_at": datetime.now(timezone.utc)
            }
            updated_review = await self.review_repo.update_processed_data(review_id, failed_data)
            return updated_review
        except Exception as e:
            logger.error(f"Failed to mark review {review_id} as failed: {str(e)}")
            

    def _is_review_processed(self, review: ReviewInDB) -> bool:
        """Check if review has been successfully processed."""
        if not hasattr(review, 'processed_data') or not review.processed_data:
            return False
        
        if hasattr(review.processed_data, 'processing_status'):
            return review.processed_data.processing_status == 'completed'
        
        return False


# Global service instance
basic_analyzer_service = BasicAnalyzer()