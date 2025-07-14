# backend/app/services/llm_agents.py
"""Centralized LLM Agent Management System

Provides unified interface for all AI services with easy model swapping
between development (Ollama) and production (Gemini/OpenAI) environments.
"""

import json
import os
from abc import ABC
from typing import Any

from langchain.chains.llm import LLMChain
from langchain.prompts import PromptTemplate
from langchain_ollama import OllamaLLM
from langsmith import traceable

# LangSmith configuration
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "REMOVED_API_KEY"
os.environ["LANGCHAIN_PROJECT"] = "reviews-analysis"


class BaseLLMAgent(ABC):
    """Base class for all LLM agents"""

    def __init__(self, model_name: str = "qwen2.5:3b-instruct"):
        self.model_name = model_name
        self.llm = self._initialize_llm()

    def _initialize_llm(self):
        """Initialize LLM based on environment and model name"""
        # Development: Use Ollama
        if self.model_name.startswith("qwen") or self.model_name.startswith("gemma"):
            return OllamaLLM(
                model=self.model_name,
                base_url="http://host.docker.internal:11434",
                temperature=0.1,
                num_predict=256,
                top_k=10,
                top_p=0.9,
                repeat_penalty=1.1,
                timeout=30,
            )

        # TODO: Production - Add Gemini/OpenAI initialization
        # elif self.model_name.startswith("gemini"):
        #     return ChatGoogleGenerativeAI(model=self.model_name)
        # elif self.model_name.startswith("gpt"):
        #     return ChatOpenAI(model=self.model_name)

        raise ValueError(f"Unsupported model: {self.model_name}")


class SegmentorAgent(BaseLLMAgent):
    """Agent for generating and classifying business review segments"""

    @traceable
    async def generate_segments(
        self,
        business_name: str,
        description: str = None,
        business_context: str = None,
        sample_reviews: list[str] = None,
    ) -> tuple[list[str], float]:
        """Generate business-specific review segments

        Returns:
            Tuple[List[str], float]: (segments, confidence_score)

        """
        # Build context for LLM
        context_parts = [f"Business Name: {business_name}"]

        if description:
            context_parts.append(f"Description: {description}")

        if business_context:
            context_parts.append(f"Business Context: {business_context}")

        if sample_reviews:
            context_parts.append(f"Sample Reviews: {sample_reviews[:3]}")

        context = "\n".join(context_parts)

        template = """
        Based on the following business information, generate 5-8 specific review segments that customers commonly mention.
        Focus on actionable aspects the business owner can improve.
        
        {context}
        
        Return ONLY a JSON object with this format:
        {{
            "segments": ["segment1", "segment2", "segment3", ...],
            "confidence": 0.85
        }}
        
        Segments should be:
        - Specific to this business type
        - Actionable for business improvement
        - Commonly mentioned in reviews
        - Snake_case format (e.g., "food_quality", "wait_time")
        """

        prompt = PromptTemplate.from_template(template)
        chain = LLMChain(llm=self.llm, prompt=prompt)

        try:
            response = await chain.arun(context=context)
            result = json.loads(response.strip())

            segments = result.get("segments", [])
            confidence = result.get("confidence", 0.5)

            return segments, confidence

        except (json.JSONDecodeError, KeyError):
            # Fallback to generic segments
            generic_segments = [
                "service_quality",
                "value_for_money",
                "overall_experience",
                "cleanliness",
                "staff_friendliness",
            ]
            return generic_segments, 0.3

    @traceable
    async def classify_review_segments(
        self, review_text: str, available_segments: list[str],
    ) -> tuple[list[str], dict[str, float]]:
        """Classify a review into multiple segments with confidence scores

        Returns:
            Tuple[List[str], Dict[str, float]]: (matching_segments, segment_confidences)

        """
        template = """
        Classify the following review into the most relevant segments from the provided list.
        A review can match multiple segments. Return confidence scores for each match.
        
        Review: "{review_text}"
        
        Available Segments: {segments}
        
        Return ONLY a JSON object with this format:
        {{
            "segment_matches": {{
                "segment_name": confidence_score,
                "another_segment": confidence_score
            }}
        }}
        
        Only include segments with confidence >= 0.6
        Confidence scores should be between 0.0 and 1.0
        """

        prompt = PromptTemplate.from_template(template)
        chain = LLMChain(llm=self.llm, prompt=prompt)

        try:
            response = await chain.arun(
                review_text=review_text, segments=", ".join(available_segments),
            )
            result = json.loads(response.strip())

            segment_matches = result.get("segment_matches", {})

            # Filter segments with confidence >= 0.6
            high_confidence_matches = {
                segment: conf
                for segment, conf in segment_matches.items()
                if conf >= 0.6
            }

            matching_segments = list(high_confidence_matches.keys())

            return matching_segments, high_confidence_matches

        except (json.JSONDecodeError, KeyError):
            # Fallback: no classification
            return [], {}

    @traceable
    async def classify_reviews_batch(
        self,
        reviews: list[str],
        available_segments: list[str],
        batch_sizes: list[int] = [50, 25, 10, 5, 1],
    ) -> list[tuple[list[str], dict[str, float]]]:
        """Classify multiple reviews in batches with progressive fallback

        Args:
            reviews: List of review texts to classify
            available_segments: List of available segment names
            batch_sizes: Progressive fallback batch sizes [50, 25, 10, 5, 1]

        Returns:
            List[Tuple[List[str], Dict[str, float]]]: Results for each review

        """
        if not reviews:
            return []

        # Try each batch size until success
        for batch_size in batch_sizes:
            try:
                if batch_size == 1:
                    # Individual processing (guaranteed to work)
                    return await self._process_reviews_individually(
                        reviews, available_segments,
                    )
                # Batch processing
                return await self._process_reviews_in_batches(
                    reviews, available_segments, batch_size,
                )

            except Exception as e:
                print(f"Batch size {batch_size} failed: {e}")
                continue

        # If all batch sizes fail, return empty results
        return [([], {}) for _ in reviews]

    async def _process_reviews_in_batches(
        self, reviews: list[str], available_segments: list[str], batch_size: int,
    ) -> list[tuple[list[str], dict[str, float]]]:
        """Process reviews in batches of specified size"""
        all_results = []

        # Process in chunks
        for i in range(0, len(reviews), batch_size):
            batch = reviews[i : i + batch_size]
            batch_results = await self._process_single_batch(
                batch, available_segments, i,
            )
            all_results.extend(batch_results)

        return all_results

    async def _process_single_batch(
        self, batch_reviews: list[str], available_segments: list[str], start_index: int,
    ) -> list[tuple[list[str], dict[str, float]]]:
        """Process a single batch of reviews"""
        # Create numbered review list for LLM
        numbered_reviews = "\n".join(
            [f"{start_index + i}. {review}" for i, review in enumerate(batch_reviews)],
        )

        template = """
        Classify the following reviews into segments. Return a JSON array with results for each review.
        
        Available Segments: {segments}
        
        Reviews:
        {reviews}
        
        Return ONLY a JSON array with this exact format:
        [
            {{"review_index": 0, "segments": {{"segment_name": confidence_score}}}},
            {{"review_index": 1, "segments": {{"segment_name": confidence_score}}}},
            ...
        ]
        
        Rules:
        - Include ALL reviews (indexes {start_index} to {end_index})
        - Only include segments with confidence >= 0.6
        - Confidence scores between 0.0 and 1.0
        - Multiple segments per review are allowed
        """

        prompt = PromptTemplate.from_template(template)
        chain = LLMChain(llm=self.llm, prompt=prompt)

        # Increase timeout for batch processing
        original_timeout = self.llm.timeout
        self.llm.timeout = min(60, original_timeout * 2)

        try:
            response = await chain.arun(
                reviews=numbered_reviews,
                segments=", ".join(available_segments),
                start_index=start_index,
                end_index=start_index + len(batch_reviews) - 1,
            )

            # Parse and validate response
            result = json.loads(response.strip())

            if not self._validate_batch_response(
                result, len(batch_reviews), start_index,
            ):
                raise ValueError("Invalid batch response format")

            # Convert to expected format
            batch_results = []
            for item in result:
                segments_dict = item.get("segments", {})

                # Filter high-confidence segments
                high_confidence = {
                    seg: conf for seg, conf in segments_dict.items() if conf >= 0.6
                }

                matching_segments = list(high_confidence.keys())
                batch_results.append((matching_segments, high_confidence))

            return batch_results

        except (json.JSONDecodeError, ValueError, KeyError) as e:
            raise Exception(f"Batch processing failed: {e}")

        finally:
            # Restore original timeout
            self.llm.timeout = original_timeout

    async def _process_reviews_individually(
        self, reviews: list[str], available_segments: list[str],
    ) -> list[tuple[list[str], dict[str, float]]]:
        """Fallback: process each review individually"""
        results = []
        for review in reviews:
            try:
                segments, confidences = await self.classify_review_segments(
                    review, available_segments,
                )
                results.append((segments, confidences))
            except Exception:
                # If individual processing fails, return empty result
                results.append(([], {}))

        return results

    def _validate_batch_response(
        self, response: Any, expected_count: int, start_index: int,
    ) -> bool:
        """Validate that batch response has correct format and count"""
        if not isinstance(response, list):
            return False

        if len(response) != expected_count:
            return False

        # Check each result has required fields and correct index
        for i, item in enumerate(response):
            if not isinstance(item, dict):
                return False

            if "review_index" not in item or "segments" not in item:
                return False

            expected_index = start_index + i
            if item["review_index"] != expected_index:
                return False

            if not isinstance(item["segments"], dict):
                return False

        return True


class SentimentAnalyzerAgent(BaseLLMAgent):
    """Agent for advanced sentiment analysis (future enhancement)"""

    # TODO: Implement aspect-based sentiment analysis
    # TODO: Multi-language sentiment support
    # TODO: Emotion detection (happy, frustrated, disappointed)

    async def analyze_aspect_sentiment(
        self, review_text: str, aspects: list[str],
    ) -> dict[str, Any]:
        """TODO: Premium feature - Analyze sentiment for specific aspects

        Example: "Food was great but service was slow"
        -> {"food": {"sentiment": "positive", "confidence": 0.9},
            "service": {"sentiment": "negative", "confidence": 0.8}}
        """


class TranslatorAgent(BaseLLMAgent):
    """Agent for translation services (future enhancement)"""

    # TODO: Implement translation for non-English reviews
    # TODO: Language detection and auto-translation
    # TODO: Context-aware business translation

    async def translate_review(
        self, text: str, target_language: str = "en",
    ) -> tuple[str, float]:
        """TODO: Premium feature - Translate reviews with confidence

        Returns:
            Tuple[str, float]: (translated_text, confidence)

        """


class LLMAgentManager:
    """Singleton manager for all LLM agents"""

    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            # Initialize agents with configurable models
            self.segmentor = SegmentorAgent(model_name="qwen2.5:3b-instruct")
            self.sentiment_analyzer = SentimentAnalyzerAgent(
                model_name="qwen2.5:3b-instruct",
            )
            self.translator = TranslatorAgent(model_name="qwen2.5:3b-instruct")

            LLMAgentManager._initialized = True

    def get_segmentor(self) -> SegmentorAgent:
        """Get the segmentation agent"""
        return self.segmentor

    def get_sentiment_analyzer(self) -> SentimentAnalyzerAgent:
        """Get the sentiment analysis agent"""
        return self.sentiment_analyzer

    def get_translator(self) -> TranslatorAgent:
        """Get the translation agent"""
        return self.translator

    def update_models(self, **model_configs):
        """Update models for production deployment

        Example:
            manager.update_models(
                segmentor="gemini-pro",
                sentiment="gpt-4",
                translator="gemini-pro"
            )

        """
        if "segmentor" in model_configs:
            self.segmentor = SegmentorAgent(model_configs["segmentor"])
        if "sentiment" in model_configs:
            self.sentiment_analyzer = SentimentAnalyzerAgent(model_configs["sentiment"])
        if "translator" in model_configs:
            self.translator = TranslatorAgent(model_configs["translator"])


# Global instance
llm_manager = LLMAgentManager()
