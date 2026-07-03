from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class StoryGenerateRequest(BaseModel):
    """Request payload for generating a new story."""
    child_name: str = Field(..., min_length=1, max_length=64, description="Child's name")
    child_age: int = Field(..., ge=0, le=99, description="Child's age (0-99)")
    theme: str = Field(..., min_length=3, max_length=256, description="Story theme/topic")
    values: list[str] = Field(default_factory=list, description="Moral values to teach")
    duration: str = Field("short", pattern="^(short|medium|long)$", description="Story duration")
    language: str = Field("es", pattern="^[a-z]{2}$", description="ISO 639-1 language code")
    content_type: str = Field(
        "text_image_audio",
        pattern="^(text|text_image|text_audio|text_image_audio|text_image_audio_video)$",
        description="Content types to generate: types joined by underscore (text_image_audio, text_image_audio_video, etc.)"
    )


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class StoryGenerateResponse(BaseModel):
    """Response after initiating story generation."""
    story_id: str
    status: str
    message: str = "Story generation started. Check status at /api/stories/{story_id}"


class ChapterResponse(BaseModel):
    """Single chapter with media URLs."""
    id: str
    chapter_number: int
    chapter_title: str
    chapter_text: str
    url_image: Optional[str] = None
    url_audio: Optional[str] = None
    url_video: Optional[str] = None
    image_status: str = "pending"
    audio_status: str = "pending"
    video_status: str = "pending"


class StoryResponse(BaseModel):
    """Full story with chapters."""
    id: str
    user_id: str
    title: str
    child_name: str
    child_age: int
    theme: str
    values: list[str]
    target_language: str
    duration_hint: str
    canonical_character_description: str
    status: str
    error_message: Optional[str] = None
    url_video: Optional[str] = None
    video_status: str = "pending"
    text_generated: bool = False
    images_generated: bool = False
    audio_generated: bool = False
    video_generated: bool = False
    created_at: datetime
    chapters: list[ChapterResponse] = []


class StoryListItem(BaseModel):
    """Lightweight story entry for listing."""
    id: str
    title: str
    child_name: str
    status: str
    chapter_count: int = 0
    created_at: datetime


class StoryListResponse(BaseModel):
    """Paginated list of stories."""
    stories: list[StoryListItem]
    total: int
    page: int
    page_size: int


class ProgressResponse(BaseModel):
    """Real-time generation progress."""
    story_id: str
    status: str
    text_generated: bool
    images_generated: bool
    audio_generated: bool
    video_generated: bool
    chapters_completed: int
    chapters_total: int
    estimated_remaining_seconds: Optional[int] = None
    error_message: Optional[str] = None


# ============================================================================
# INTERNAL SCHEMAS (for AI pipeline)
# ============================================================================

class ChapterData(BaseModel):
    """Chapter data from AI text generation."""
    chapter_number: int
    chapter_title: str
    chapter_text: str
    image_prompt: str
    video_prompt: str


class StoryData(BaseModel):
    """Complete story data from AI text generation."""
    story_title: str
    moral_values: list[str]
    canonical_character_description: str
    chapters: list[ChapterData]


class WebhookPayload(BaseModel):
    """Webhook from external video provider (Luma, Runway, etc.)."""
    job_id: str
    status: str
    video_url: Optional[str] = None
    error: Optional[str] = None
