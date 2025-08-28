#!/bin/bash
rm -f /tmp/.X0-lock
# Run Xvfb on display 0.
Xvfb :0 -screen 0 1920x1080x16 >/dev/null 2>&1 &
# Run fluxbox windows manager on display 0.
fluxbox -display :0 >/dev/null 2>&1 &
# Run x11vnc on display 0
x11vnc -display :0 -forever -usepw >/dev/null 2>&1 &
# Add delay
sleep 2
cd /app


# Get the port from environment variable (Cloud Run sets this)
export PORT=${PORT:-8080}

# Start FastAPI server in background
echo "Starting FastAPI server on port $PORT..."
uvicorn main:app --host 0.0.0.0 --port $PORT &


echo "Starting Scraper..."
# Run as Celery worker
exec celery -A celery_app worker --loglevel=info --queues=scraping --pool=solo #--pool=threads
