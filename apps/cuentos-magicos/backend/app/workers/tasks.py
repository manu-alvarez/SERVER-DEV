"""
Celery tasks for async story generation pipeline.

Each task uses asyncio.run() with a FRESH async engine + session
(via get_async_session), avoiding event-loop conflicts from Celery's
thread/fork pool.

Usage:
    celery -A app.core.celery_app worker --loglevel=info --queues=stories,images,audio,video
"""
import asyncio
import logging
from typing import Any

from sqlalchemy import select

from app.core.celery_app import celery_app
from app.core.db import get_async_session
from app.services.story_planner import generate_story_text, save_story_data
from app.services.image_generation import generate_images_for_story
from app.services.audio_generation import generate_audio_for_story
from app.services.video_generation import generate_video_for_story
from app.models.orm import Story

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.story_text_generation", bind=True, queue="stories")
def story_text_generation_task(self, story_id: str, tier_limits: dict):
    """Celery task: Generate story text, then chain media generation."""
    logger.info(f"Celery: Starting text generation for story_id={story_id}")
    try:
        asyncio.run(_run_text_generation(story_id, tier_limits))
        logger.info(f"Celery: Text generation completed for story_id={story_id}")
    except Exception as e:
        logger.error(f"Celery: Text generation failed for story_id={story_id}: {e}")
        raise self.retry(exc=e, countdown=120, max_retries=3)


@celery_app.task(name="app.workers.generate_images", bind=True, queue="images")
def generate_images_task(self, story_id: str):
    """Celery task: generate images for all chapters of a story."""
    logger.info(f"Celery: Starting image generation for story_id={story_id}")
    try:
        asyncio.run(_run_images(story_id))
        logger.info(f"Celery: Image generation completed for story_id={story_id}")
    except Exception as e:
        logger.error(f"Celery: Image generation failed for story_id={story_id}: {e}")
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(name="app.workers.generate_audio", bind=True, queue="audio")
def generate_audio_task(self, story_id: str):
    """Celery task: generate audio for all chapters of a story."""
    logger.info(f"Celery: Starting audio generation for story_id={story_id}")
    try:
        asyncio.run(_run_audio(story_id))
        logger.info(f"Celery: Audio generation completed for story_id={story_id}")
    except Exception as e:
        logger.error(f"Celery: Audio generation failed for story_id={story_id}: {e}")
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(name="app.workers.generate_video", bind=True, queue="video")
def generate_video_task(self, story_id: str):
    """Celery task: generate video for all chapters of a story."""
    logger.info(f"Celery: Starting video generation for story_id={story_id}")
    try:
        asyncio.run(_run_video(story_id))
        logger.info(f"Celery: Video generation completed for story_id={story_id}")
    except Exception as e:
        logger.error(f"Celery: Video generation failed for story_id={story_id}: {e}")
        raise self.retry(exc=e, countdown=120, max_retries=2)


async def _run_text_generation(story_id: str, tier_limits: dict):
    """Run text generation with fresh async session."""
    async with get_async_session() as session:
        result = await session.execute(select(Story).where(Story.id == story_id))
        story = result.scalar_one_or_none()
        if not story:
            raise ValueError(f"Story {story_id} not found for text generation.")

        story.status = "processing"
        await session.commit()

        data = await generate_story_text(session, story)
        await save_story_data(session, story, data)
        await session.commit()

        # Read content_type from initial payload to decide which media to generate
        content_type = (story.initial_prompt or {}).get("content_type", "text")
        parts = set(content_type.split("_"))

        if "image" in parts and story.canonical_character_description:
            generate_images_task.delay(story_id)

        if "audio" in parts and story.text_generated:
            generate_audio_task.delay(story_id)

        if "video" in parts and tier_limits.get("video_enabled", False):
            generate_video_task.delay(story_id)

        story.status = "text_ready"
        await session.commit()
        await _check_and_mark_ready(session, story_id)


async def _run_images(story_id: str):
    async with get_async_session() as session:
        await generate_images_for_story(session, story_id)
        await session.commit()
        await _check_and_mark_ready(session, story_id)


async def _run_audio(story_id: str):
    async with get_async_session() as session:
        await generate_audio_for_story(session, story_id)
        await session.commit()
        await _check_and_mark_ready(session, story_id)


async def _run_video(story_id: str):
    async with get_async_session() as session:
        await generate_video_for_story(session, story_id)
        await session.commit()
        await _check_and_mark_ready(session, story_id)


async def _check_and_mark_ready(session, story_id: str):
    """Check if all media generation is complete and mark story as ready.

    Only checks flags that were actually requested via content_type.
    """
    result = await session.execute(
        select(Story).where(Story.id == story_id).execution_options(populate_existing=True)
    )
    story = result.scalar_one_or_none()
    if not story:
        return

    content_type = (story.initial_prompt or {}).get("content_type", "text")
    parts = set(content_type.split("_"))

    checks = [story.text_generated]
    if "image" in parts:
        checks.append(story.images_generated)
    if "audio" in parts:
        checks.append(story.audio_generated)
    if "video" in parts:
        checks.append(story.video_generated)

    all_ready = all(checks)

    if all_ready and story.status != "ready":
        story.status = "ready"
        await session.commit()
        logger.info(f"Story {story_id} marked as ready")
