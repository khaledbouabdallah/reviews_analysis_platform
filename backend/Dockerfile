# Development stage
FROM python:3.12-slim as development

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the API port
EXPOSE 8000

# Get inside app folder
WORKDIR /app/app

# Command to run the API server with hot reload
CMD ["uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]

# Production stage
FROM python:3.12-slim as production

WORKDIR /app

# Install system dependencies (minimal for production)
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies (no cache for smaller image)
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the API port
EXPOSE 8000

# Get inside app folder
WORKDIR /app/app

# Command to run the API server (no reload for production)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]