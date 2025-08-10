# backend/app/main.py (UPDATED)
"""FastAPI main application for the Complaint Management Platform.

This module sets up the FastAPI application and defines the API endpoints.
"""

from contextlib import asynccontextmanager
from typing import Any

from api.routers import businesses, jobs, locations, review_analyzer, reviews, sources
from api.routers.auth import router as auth_router
from db.mongodb import init_indexes
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI) -> Any:
    """Lifespan context manager for the FastAPI application.
    This is used to perform startup and shutdown tasks.
    """
    # Perform startup tasks
    await init_indexes()
    yield
    # Perform shutdown tasks


# Create FastAPI app
app = FastAPI(
    title="Complaint Management API",
    description="API for preprocessing and analyzing customer complaints and reviews",
    version="0.1.0",
    lifespan=lifespan,
)


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers with auth first
app.include_router(auth_router, prefix="/api")
# app.include_router(users.router, prefix="/api") # Uncomment when user management is implemented
app.include_router(businesses.router, prefix="/api")
app.include_router(locations.router, prefix="/api")
app.include_router(sources.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(review_analyzer.router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {"message": "Complaint Management API. See /docs for documentation."}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "API is running"}
