import os
import logging

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
LOGGER = logging.getLogger("StreamlitApp")
LOGGER.setLevel(logging.INFO)


# Backend API Configuration
BACKEND_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000")

# App Configuration
APP_TITLE = "Reviews Analysis Platform"
APP_ICON = "📊"
LAYOUT = "wide"

# Developer Info
DEVELOPER = "Khaled Bouabdallah"
