#!/bin/bash
rm -f /tmp/.X0-lock
# Run Xvfb on display 0.
Xvfb :0 -screen 0 1920x1080x16 >/dev/null 2>&1 &
# Run fluxbox windows manager on display 0.
fluxbox -display :0 >/dev/null 2>&1 &
# Run x11vnc on display 0
x11vnc -display :0 -forever -usepw >/dev/null 2>&1 &
# Add delay
sleep 10
cd /app/app
ECHO "Starting Scraper..."
# Run as Celery worker
exec celery -A celery_app worker --loglevel=info --queues=scraping --pool=threads
