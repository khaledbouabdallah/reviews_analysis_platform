"""Sentiment analysis module for the Complaint Management Platform.

This module provides functionality to analyze sentiment in text content.
Uses NLTK's VADER for English and multi-language support via TextBlob.
"""

from typing import Any

import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from textblob import TextBlob

# Download VADER lexicon if not already downloaded
try:
    nltk.data.find("vader_lexicon")
except LookupError:
    nltk.download("vader_lexicon")


class SentimentAnalyzer:
    """Sentiment analysis class that handles multiple languages."""

    def __init__(self):
        """Initialize the sentiment analyzer with VADER for English."""
        self.vader = SentimentIntensityAnalyzer()

    def analyze(self, text: str, language: str = "en") -> dict[str, Any]:
        """Analyze the sentiment of the given text.

        Args:
            text (str): Text to analyze
            language (str): Language code (e.g., 'en', 'fr', 'ar')

        Returns:
            Dict[str, Any]: Sentiment analysis results containing:
                - compound: Overall sentiment score (-1 to 1)
                - sentiment: Categorical sentiment (positive, negative, neutral)
                - scores: Detailed scores for different sentiments

        """
        if not text or len(text.strip()) == 0:
            return {
                "compound": 0.0,
                "sentiment": "neutral",
                "scores": {"pos": 0.0, "neg": 0.0, "neu": 1.0},
            }

        # Use VADER for English
        if language == "en":
            return self._analyze_with_vader(text)

        # Use TextBlob for other languages
        return self._analyze_with_textblob(text)

    def _analyze_with_vader(self, text: str) -> dict[str, Any]:
        """Analyze sentiment using VADER (optimized for English)."""
        scores = self.vader.polarity_scores(text)
        sentiment, confidence = self._interpret_scores(
            scores["compound"], (scores["pos"], scores["neg"], scores["neu"]),
        )

        return {
            "compound": scores["compound"],
            "sentiment": sentiment,
            "confidence": confidence,
            "scores": {
                "pos": scores["pos"],
                "neg": scores["neg"],
                "neu": scores["neu"],
            },
        }

    def _analyze_with_textblob(self, text: str) -> dict[str, Any]:
        """Analyze sentiment using TextBlob (works with multiple languages)."""
        blob = TextBlob(text)

        # TextBlob polarity ranges from -1 to 1
        polarity = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity

        # Convert to VADER-like scores for consistency
        pos = max(0, polarity)
        neg = max(0, -polarity)
        neu = 1.0 - (abs(polarity) * subjectivity)

        sentiment, confidence = self._interpret_scores(polarity, (pos, neg, neu))

        return {
            "compound": polarity,
            "sentiment": sentiment,
            "confidence": confidence,
            "scores": {
                "pos": pos,
                "neg": neg,
                "neu": neu,
                "subjectivity": subjectivity,
            },
        }

    def _interpret_scores(
        self, compound: float, detailed_scores: tuple[float, float, float],
    ) -> tuple[str, float]:
        """Interpret sentiment scores and determine category and confidence.

        Args:
            compound (float): Overall sentiment score
            detailed_scores (Tuple[float, float, float]): (positive, negative, neutral) scores

        Returns:
            Tuple[str, float]: Sentiment category and confidence

        """
        pos, neg, neu = detailed_scores

        # Determine sentiment category
        if compound >= 0.05:
            sentiment = "positive"
            confidence = pos
        elif compound <= -0.05:
            sentiment = "negative"
            confidence = neg
        else:
            sentiment = "neutral"
            confidence = neu

        return sentiment, confidence
