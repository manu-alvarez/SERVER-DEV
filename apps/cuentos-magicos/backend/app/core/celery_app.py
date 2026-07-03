from celery import Celery
from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "cuentosmagicos",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.workers.story_text_generation": {"queue": "stories"},
        "app.workers.generate_images": {"queue": "images"},
        "app.workers.generate_audio": {"queue": "audio"},
        "app.workers.generate_video": {"queue": "video"},
    },
    task_default_queue="default",
    task_queues={
        "default": {"exchange": "default", "routing_key": "default"},
        "stories": {"exchange": "stories", "routing_key": "stories"},
        "images": {"exchange": "images", "routing_key": "images"},
        "audio": {"exchange": "audio", "routing_key": "audio"},
        "video": {"exchange": "video", "routing_key": "video"},
    },
    task_default_exchange="default",
    task_default_routing_key="default",
)

# Explicitly discover tasks from the workers module
celery_app.autodiscover_tasks(["app.workers"])
