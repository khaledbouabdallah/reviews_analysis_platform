from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
import os
import logging
import time

# print current working directory
print("Current working directory:", os.getcwd())
from routers.google_scrapper import router as google_scraper_router
from routers.core import router as core_router
from core.config import settings





# Import the scraper class


app = FastAPI(title="Google Maps Review Scraper API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(core_router, prefix="", tags=["Core"])
app.include_router(google_scraper_router, prefix="/google", tags=["Google Scraper"])



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)