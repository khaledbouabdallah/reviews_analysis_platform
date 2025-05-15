"""
FastAPI main application for the Complaint Management Platform.

This module sets up the FastAPI application and defines the API endpoints.
"""


from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings, logger
from api.routers import users


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


app.include_router(users.router, prefix="/api")


# Define API endpoints
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {"message": "Complaint Management API. See /docs for documentation."}




