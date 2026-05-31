#!/bin/bash
set -e

# Collect static files (Django admin CSS/JS, etc.)
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

# Start the application
echo "Starting Uvicorn..."
exec uvicorn src.asgi:application --host 0.0.0.0 --port 8000 --workers 1
