#!/bin/bash
# Start Celery Worker for Cuentos Magicos

# Source the environment variables if any
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Run celery using the virtual environment's python
exec /home/ubuntu/MSBrossAI/apps/cuentos-magicos/backend/venv/bin/python3 -m celery -A app.core.celery_app worker --loglevel=info --queues=stories,images,audio,video --concurrency=2
