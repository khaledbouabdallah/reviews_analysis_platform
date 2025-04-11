FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    gnupg \
    apt-transport-https \
    ca-certificates \
    curl \
    sudo \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Copy ChromeDriver installation script and requirements
COPY install_chromedriver.sh .
COPY requirements.txt .

# Make install script executable
RUN chmod +x install_chromedriver.sh

# Install Chrome and ChromeDriver


# check if Chrome is already installed
RUN ./install_chromedriver.sh

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir fastapi uvicorn pydantic

# Copy application code
COPY app/ ./app/

# Create necessary directories
RUN mkdir -p data logs

# Add ChromeDriver to PATH
ENV PATH="/app/Driver:${PATH}"

# Set environment variables for Chrome to run in headless mode
ENV DISPLAY=:99
ENV PYTHONUNBUFFERED=1

# Expose the API port
EXPOSE 8001

# Add entry script
RUN echo '#!/bin/bash\n\
# Start virtual display for headless Chrome\n\
Xvfb :99 -screen 0 1280x1024x24 > /dev/null 2>&1 &\n\
\n\
# Default to API server if no arguments are provided\n\
if [ "$1" = "api" ] || [ $# -eq 0 ]; then\n\
  echo "Starting API server..."\n\
  exec uvicorn app.main:app --reload --host 0.0.0.0 --port 8001\n\
else\n\
  echo "Running scraper with provided arguments..."\n\
  exec python -m app.google_reviews_scrapper "$@"\n\
fi\n'\
> entrypoint.sh && chmod +x entrypoint.sh

# Set entrypoint
ENTRYPOINT ["entrypoint.sh"]
