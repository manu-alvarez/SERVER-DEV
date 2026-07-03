import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.security import moderate_user_input, get_tier_limits
from app.models.orm import Story, Chapter, User
from app.models.schemas import (
    StoryGenerateRequest,
    StoryGenerateResponse,
    StoryResponse,
    ChapterResponse,
    StoryListResponse,
    StoryListItem,
    ProgressResponse,
)
from app.services.story_planner import generate_story_text, save_story_data
from app.services.image_generation import generate_images_for_story
from app.services.audio_generation import generate_audio_for_story
from app.services.video_generation import generate_video_for_story
from app.workers.tasks import story_text_generation_task, generate_images_task, generate_audio_task, generate_video_task

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/stories", tags=["stories"])


@router.post("/generate", response_model=StoryGenerateResponse)
async def generate_story(
    payload: StoryGenerateRequest,
    session: AsyncSession = Depends(get_session),
    user_id: Optional[str] = None,
):
    """
    Initiate story generation pipeline via Celery.
    Returns immediately with a story_id; processing happens asynchronously.
    """
    # Moderate user input for child safety
    moderate_user_input(payload.model_dump())

    # Create a minimal user lookup (in production, use proper auth middleware)
    user = None
    if user_id:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

    if user:
        # Check quota
        if user.monthly_story_used >= user.monthly_story_quota:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Monthly story quota reached. Upgrade your plan for more stories.",
            )

        user.monthly_story_used += 1
        tier_limits = get_tier_limits(user.subscription_tier)
    else:
        # Guest / free tier
        tier_limits = get_tier_limits("free")

    # Create story record
    story = Story(
        user_id=user.id if user else None,
        child_name=payload.child_name,
        child_age=payload.child_age,
        theme=payload.theme,
        values=payload.values,
        initial_prompt=payload.model_dump(),
        target_language=payload.language,
        duration_hint=payload.duration,
        status="text_pending", # New status: waiting for text generation
    )
    session.add(story)
    await session.commit()
    await session.refresh(story)

    # --- ASYNCHRONOUS EXECUTION VIA CELERY ---
    # 1. Launch Text Generation Task
    story_text_generation_task.delay(str(story.id), tier_limits)
    
    return StoryGenerateResponse(
        story_id=str(story.id),
        status=story.status,
        message="Text generation queued. Poll /api/stories/{id}/progress for status.",
    )


@router.get("/{story_id}", response_model=StoryResponse)
async def get_story(
    story_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Retrieve a story with all its chapters."""
    result = await session.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()

    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")

    chapters_result = await session.execute(
        select(Chapter)
        .where(Chapter.story_id == story_id)
        .order_by(Chapter.chapter_number)
    )
    chapters = chapters_result.scalars().all()

    return StoryResponse(
        id=str(story.id),
        user_id=str(story.user_id) if story.user_id else "",
        title=story.title,
        child_name=story.child_name,
        child_age=story.child_age,
        theme=story.theme,
        values=story.values or [],
        target_language=story.target_language,
        duration_hint=story.duration_hint,
        canonical_character_description=story.canonical_character_description,
        status=story.status,
        error_message=story.error_message,
        text_generated=story.text_generated,
        images_generated=story.images_generated,
        audio_generated=story.audio_generated,
        video_generated=story.video_generated,
        url_video=story.url_video,
        video_status=story.video_status,
        created_at=story.created_at,
        chapters=[
            ChapterResponse(
                id=str(ch.id),
                chapter_number=ch.chapter_number,
                chapter_title=ch.chapter_title,
                chapter_text=ch.chapter_text,
                url_image=ch.url_image,
                url_audio=ch.url_audio,
                url_video=ch.url_video,
                image_status=ch.image_status,
                audio_status=ch.audio_status,
                video_status=ch.video_status,
            )
            for ch in chapters
        ],
    )


@router.get("/{story_id}/progress", response_model=ProgressResponse)
async def get_story_progress(
    story_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get real-time generation progress for a story."""
    result = await session.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()

    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")

    chapters_result = await session.execute(
        select(Chapter).where(Chapter.story_id == story_id)
    )
    chapters = chapters_result.scalars().all()

    chapters_completed = sum(
        1 for ch in chapters
        if ch.image_status == "done" and ch.audio_status == "done"
    )

    # Calculate estimated remaining time
    initial_prompt = story.initial_prompt or {}
    content_type = initial_prompt.get("content_type", "text")
    parts = set(content_type.split("_"))

    # Typical processing times (seconds per chapter)
    TEXT_TIME = 45
    IMAGE_TIME = 12
    AUDIO_TIME = 18
    VIDEO_TIME = 20
    CONCAT_TIME = 15

    estimated_seconds = 0

    # Text generation time (whole story)
    if not story.text_generated:
        estimated_seconds += TEXT_TIME
    else:
        # Media generation per remaining chapters
        remaining_chapters = len(chapters) - chapters_completed
        if remaining_chapters > 0:
            if "image" in parts and not story.images_generated:
                pending_images = sum(
                    1 for ch in chapters
                    if ch.image_status in ("pending", "processing")
                )
                estimated_seconds += pending_images * IMAGE_TIME

            if "audio" in parts and not story.audio_generated:
                pending_audio = sum(
                    1 for ch in chapters
                    if ch.audio_status in ("pending", "processing")
                )
                estimated_seconds += pending_audio * AUDIO_TIME

            if "video" in parts and not story.video_generated:
                pending_video = sum(
                    1 for ch in chapters
                    if ch.video_status in ("pending", "processing")
                )
                estimated_seconds += (pending_video * VIDEO_TIME) + CONCAT_TIME

    # Determine overall status based on sequential steps
    if story.status == "text_pending":
        current_status = "Text Generation Queued"
    elif story.status == "processing":
        current_status = "Text Generation in Progress"
    elif story.status == "text_ready" and story.images_generated == False:
        current_status = "Text Ready, Media Generation Pending"
    elif story.status == "ready":
        current_status = "Ready"
    elif story.status == "failed":
        current_status = "Failed"
    else:
        current_status = story.status # Fallback to stored status

    return ProgressResponse(
        story_id=str(story.id),
        status=current_status,
        text_generated=story.text_generated,
        images_generated=story.images_generated,
        audio_generated=story.audio_generated,
        video_generated=story.video_generated,
        chapters_completed=chapters_completed,
        chapters_total=len(chapters),
        estimated_remaining_seconds=estimated_seconds if estimated_seconds > 0 else None,
        error_message=story.error_message,
    )


@router.post("/{story_id}/retry", status_code=status.HTTP_200_OK)
async def retry_story(
    story_id: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Retry failed media generation for a story.
    Resets failed chapters and re-launches Celery tasks for images and audio.
    """
    result = await session.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()

    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")

    if story.status == "ready":
        return {"message": "Story is already ready, no retry needed", "story_id": story_id}

    chapters_result = await session.execute(
        select(Chapter).where(Chapter.story_id == story_id).order_by(Chapter.chapter_number)
    )
    chapters = chapters_result.scalars().all()

    if not chapters:
        raise HTTPException(status_code=400, detail="No chapters found for this story")

    # Reset failed image chapters
    for ch in chapters:
        if ch.image_status == "failed":
            ch.image_status = "pending"
        if ch.audio_status == "failed":
            ch.audio_status = "pending"

    # Reset story flags
    story.images_generated = all(ch.image_status == "done" for ch in chapters)
    story.audio_generated = all(ch.audio_status == "done" for ch in chapters)

    if not story.text_generated:
        story.status = "text_pending"
    elif not story.images_generated or not story.audio_generated:
        story.status = "text_ready"

    await session.commit()

    # Re-launch Celery tasks
    if story.text_generated:
        if not story.images_generated and story.canonical_character_description:
            generate_images_task.delay(story_id)
        if not story.audio_generated:
            generate_audio_task.delay(story_id)

    return {
        "message": "Retry initiated for story",
        "story_id": story_id,
        "status": story.status,
    }


@router.get("/", response_model=StoryListResponse)
async def list_stories(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    """List stories with pagination."""
    query = select(Story)
    if user_id:
        query = query.where(Story.user_id == user_id)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    # Get paginated results
    offset = (page - 1) * page_size
    query = query.order_by(Story.created_at.desc()).offset(offset).limit(page_size)
    result = await session.execute(query)
    stories = result.scalars().all()

    items = []
    for story in stories:
        chapter_count_result = await session.execute(
            select(func.count()).where(Chapter.story_id == story.id)
        )
        chapter_count = chapter_count_result.scalar() or 0

        items.append(StoryListItem(
            id=str(story.id),
            title=story.title or story.theme,
            child_name=story.child_name,
            status=story.status,
            chapter_count=chapter_count,
            created_at=story.created_at,
        ))

    return StoryListResponse(
        stories=items,
        total=total,
        page=page,
        page_size=page_size,
    )