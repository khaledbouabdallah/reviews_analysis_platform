
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def root():
    """Root endpoint with API information."""
    return {"message": "Google Maps Review Scraper API. See /docs for documentation."}
