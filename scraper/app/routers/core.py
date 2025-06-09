from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from typing import List, Optional
from datetime import datetime
from db.mongodb import db, jobs_collection


router = APIRouter()

@router.get("/")
async def root():
    """Root endpoint with API information."""
    return {"message": "Google Maps Review Scraper API. See /docs for documentation."}
