"""
FastAPI main application for the Complaint Management Platform.

This module sets up the FastAPI application and defines the API endpoints.
"""

from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings, logger
from api.routers import users, businesses, sources, jobs, reviews, analyzer
from db.mongodb import init_indexes
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI) -> Any:
    """
    Lifespan context manager for the FastAPI application.
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


# Include routers
app.include_router(users.router, prefix="/api")
app.include_router(businesses.router, prefix="/api")
app.include_router(sources.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(analyzer.router, prefix="/api")


# Define API endpoints
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {"message": "Complaint Management API. See /docs for documentation."}
