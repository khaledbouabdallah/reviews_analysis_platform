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
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    libvulkan1 \
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
echo "Starting API server..."\n\
cd /app/app \n\
exec uvicorn main:app --reload --host 0.0.0.0 --port 8001\n\
'\
> entrypoint.sh && chmod +x entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
