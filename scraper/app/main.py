import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# print current working directory
print("Current working directory:", os.getcwd())
from routers.core import router as core_router
from routers.google_scrapper import router as google_scraper_router

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
