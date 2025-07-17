from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class AnalysisTask(str, Enum):
    """Available analysis tasks"""

    LANGUAGE_DETECTION = "language_detection"
    TRANSLATION = "translation"
    SENTIMENT = "sentiment"
    TOPICS = "topics"
    SPAM_DETECTION = "spam_detection"
    URGENCY = "urgency"
    BUSINESS_INSIGHTS = "business_insights"


# Individual component schemas
class LanguageAnalysis(BaseModel):
    detected_language: str = Field(
        ..., description="ISO 639-1 language code (en, fr, ar, es, etc.)"
    )


class TranslationAnalysis(BaseModel):
    english_translation: str = Field(
        ..., description="English translation of the review"
    )


class SentimentAnalysis(BaseModel):
    label: Literal["positive", "negative", "neutral"] = Field(
        ..., description="Overall sentiment classification"
    )
    confidence: float = Field(
        ..., description="Confidence score for sentiment classification"
    )
    emotional_tone: Literal[
        "angry", "frustrated", "happy", "disappointed", "satisfied", "neutral"
    ] = Field(..., description="Specific emotional tone detected")
    reasoning: str = Field(
        ..., description="Brief explanation of sentiment classification"
    )


class TopicAnalysis(BaseModel):
    topic: str = Field(..., description="Topic mentioned in review")
    sentiment: Literal["positive", "negative", "neutral"] = Field(
        ..., description="Sentiment for this specific topic"
    )
    confidence: float = Field(..., description="Confidence in topic identification")
    mentions: list[str] = Field(
        ..., description="Specific phrases related to this topic"
    )


class SpamDetection(BaseModel):
    is_spam: bool = Field(..., description="Whether review is classified as spam/fake")
    confidence: float = Field(..., description="Confidence in spam classification")
    red_flags: list[str] = Field(..., description="Spam indicators found")
    reasoning: str = Field(..., description="Explanation of spam classification")


class UrgencyClassification(BaseModel):
    level: Literal["critical", "high", "medium", "low", "none"] = Field(
        ..., description="Urgency level for customer service response"
    )
    requires_immediate_response: bool = Field(
        ..., description="Whether immediate response is needed"
    )
    escalation_needed: bool = Field(
        ..., description="Whether issue should be escalated to management"
    )
    reasoning: str = Field(..., description="Explanation of urgency classification")


class BusinessInsights(BaseModel):
    main_issues: list[str] = Field(
        ..., description="Key problems or complaints identified"
    )
    positive_highlights: list[str] = Field(
        ..., description="Positive aspects mentioned by customer"
    )
    actionable_recommendations: list[str] = Field(
        ..., description="Specific actions business should take"
    )
    estimated_impact: Literal["high", "medium", "low"] = Field(
        ..., description="Estimated impact on business if not addressed"
    )
    follow_up_needed: bool = Field(
        ..., description="Whether follow-up with customer is recommended"
    )
