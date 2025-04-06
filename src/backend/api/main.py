"""
FastAPI main application for the Complaint Management Platform.

This module sets up the FastAPI application and defines the API endpoints.
"""

from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.ai.models.classification import TextClassifier
from backend.ai.models.sentiment import SentimentAnalyzer

# Import our AI components
from backend.ai.preprocessing.cleaner import preprocess_comment
from backend.ai.preprocessing.language import (
    detect_language,
    detect_language_with_confidence,
)

# Create FastAPI app
app = FastAPI(
    title="Complaint Management API",
    description="API for preprocessing and analyzing customer complaints and reviews",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize our analyzers
sentiment_analyzer = SentimentAnalyzer()
text_classifier = TextClassifier()


# Define request and response models
class TextRequest(BaseModel):
    text: str = Field(..., description="The text to analyze")


class CleanTextResponse(BaseModel):
    original: str = Field(..., description="Original unprocessed text")
    cleaned: str = Field(..., description="Cleaned and preprocessed text")


class LanguageResponse(BaseModel):
    language: str = Field(..., description="Detected language code")
    confidence: Optional[Dict[str, float]] = Field(
        None, description="Confidence scores by language"
    )


class SentimentResponse(BaseModel):
    sentiment: str = Field(
        ..., description="Overall sentiment (positive, negative, neutral)"
    )
    compound: float = Field(..., description="Compound sentiment score (-1 to 1)")
    confidence: float = Field(..., description="Confidence in sentiment classification")
    scores: Dict[str, float] = Field(..., description="Detailed sentiment scores")


class ClassificationResponse(BaseModel):
    topics: Dict[str, float] = Field(
        ..., description="Detected topics with confidence scores"
    )
    urgency: Dict[str, Any] = Field(..., description="Urgency assessment")


class FullAnalysisResponse(BaseModel):
    original_text: str = Field(..., description="Original text")
    cleaned_text: str = Field(..., description="Cleaned text")
    language: LanguageResponse = Field(..., description="Language detection results")
    sentiment: SentimentResponse = Field(..., description="Sentiment analysis results")
    classification: ClassificationResponse = Field(
        ..., description="Classification results"
    )


# Define API endpoints
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {"message": "Complaint Management API. See /docs for documentation."}


@app.post("/preprocess", response_model=CleanTextResponse)
async def process_text(request: TextRequest):
    """Clean and preprocess text."""
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    cleaned = preprocess_comment(request.text)
    return {"original": request.text, "cleaned": cleaned}


@app.post("/detect-language", response_model=LanguageResponse)
async def detect_text_language(request: TextRequest):
    """Detect the language of text."""
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    language = detect_language(request.text)
    confidence = detect_language_with_confidence(request.text)

    return {"language": language, "confidence": confidence}


@app.post("/analyze-sentiment", response_model=SentimentResponse)
async def analyze_text_sentiment(request: TextRequest):
    """Analyze sentiment of text."""
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # First detect language
    language = detect_language(request.text)

    # Then analyze sentiment
    result = sentiment_analyzer.analyze(request.text, language)

    return result


@app.post("/classify", response_model=ClassificationResponse)
async def classify_text(request: TextRequest):
    """Classify text into topics and assess urgency."""
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # First detect language
    language = detect_language(request.text)

    # Then classify
    topics = text_classifier.classify_topic(request.text, language)
    urgency = text_classifier.assess_urgency(request.text, language)

    return {"topics": topics, "urgency": urgency}


@app.post("/analyze", response_model=FullAnalysisResponse)
async def full_analysis(request: TextRequest):
    """Perform full analysis on text."""
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Clean text
    cleaned_text = preprocess_comment(request.text)

    # Detect language
    language_code = detect_language(request.text)
    language_confidence = detect_language_with_confidence(request.text)

    # Analyze sentiment
    sentiment_result = sentiment_analyzer.analyze(request.text, language_code)

    # Classify
    topics = text_classifier.classify_topic(request.text, language_code)
    urgency = text_classifier.assess_urgency(request.text, language_code)

    return {
        "original_text": request.text,
        "cleaned_text": cleaned_text,
        "language": {"language": language_code, "confidence": language_confidence},
        "sentiment": sentiment_result,
        "classification": {"topics": topics, "urgency": urgency},
    }
