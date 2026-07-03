from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship

from app.core.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=True)
    name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    subscription_tier = Column(String, nullable=False, default="free", server_default=text("'free'"))
    subscription_expires_at = Column(DateTime(timezone=True), nullable=True)
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)

    monthly_story_quota = Column(Integer, nullable=False, default=5, server_default=text("5"))
    monthly_story_used = Column(Integer, nullable=False, default=0, server_default=text("0"))
    quota_reset_date = Column(DateTime, nullable=True)

    default_language = Column(String, nullable=False, default="es", server_default=text("'es'"))
    default_voice = Column(String, nullable=True, default="alloy")

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    stories = relationship("Story", back_populates="user", cascade="all, delete-orphan")


class Story(Base):
    __tablename__ = "stories"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    child_name = Column(String, nullable=False)
    child_age = Column(Integer, nullable=False)
    theme = Column(String, nullable=False)
    values = Column(ARRAY(String), nullable=False, server_default=text("'{}'"))
    initial_prompt = Column(JSONB, nullable=False)
    target_language = Column(String, nullable=False, default="es", server_default=text("'es'"))
    duration_hint = Column(String, nullable=False, default="short", server_default=text("'short'"))

    title = Column(String, nullable=False, default="", server_default=text("''"))
    moral_values = Column(ARRAY(String), nullable=False, server_default=text("'{}'"))
    canonical_character_description = Column(Text, nullable=False, default="", server_default=text("''"))

    image_seed = Column(Integer, nullable=True)

    status = Column(String, nullable=False, default="pending", server_default=text("'pending'"))
    error_message = Column(Text, nullable=True)

    text_generated = Column(Boolean, nullable=False, default=False, server_default=text("false"))
    images_generated = Column(Boolean, nullable=False, default=False, server_default=text("false"))
    audio_generated = Column(Boolean, nullable=False, default=False, server_default=text("false"))
    video_generated = Column(Boolean, nullable=False, default=False, server_default=text("false"))

    url_video = Column(String, nullable=True)
    video_status = Column(String, nullable=False, default="pending", server_default=text("'pending'"))

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    user = relationship("User", back_populates="stories")
    chapters = relationship("Chapter", back_populates="story", cascade="all, delete-orphan",
                           order_by="Chapter.chapter_number")
    jobs = relationship("GenerationJob", back_populates="story", cascade="all, delete-orphan")


class Chapter(Base):
    __tablename__ = "chapters"
    __table_args__ = (
        UniqueConstraint("story_id", "chapter_number"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    story_id = Column(UUID(as_uuid=True), ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)

    chapter_number = Column(Integer, nullable=False)
    chapter_title = Column(String, nullable=False)
    chapter_text = Column(Text, nullable=False)

    image_prompt = Column(Text, nullable=True)
    video_prompt = Column(Text, nullable=True)
    audio_settings = Column(JSONB, nullable=True)

    url_image = Column(Text, nullable=True)
    url_audio = Column(Text, nullable=True)
    url_video = Column(Text, nullable=True)

    image_status = Column(String, nullable=False, default="pending", server_default=text("'pending'"))
    audio_status = Column(String, nullable=False, default="pending", server_default=text("'pending'"))
    video_status = Column(String, nullable=False, default="pending", server_default=text("'pending'"))

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    story = relationship("Story", back_populates="chapters")
    jobs = relationship("GenerationJob", back_populates="chapter", cascade="all, delete-orphan")


class PromptCache(Base):
    __tablename__ = "prompt_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prompt_hash = Column(String, unique=True, nullable=False)
    provider = Column(String, nullable=False)
    output_type = Column(String, nullable=False)
    payload = Column(JSONB, nullable=False)
    cache_key = Column(String, nullable=True)

    usage_count = Column(Integer, nullable=False, default=1, server_default=text("1"))
    last_used_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))


class GenerationJob(Base):
    __tablename__ = "generation_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    story_id = Column(UUID(as_uuid=True), ForeignKey("stories.id", ondelete="CASCADE"), nullable=True)
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id", ondelete="CASCADE"), nullable=True)

    job_type = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    status = Column(String, nullable=False, default="queued", server_default=text("'queued'"))
    error_message = Column(Text, nullable=True)

    external_job_id = Column(String, nullable=True)
    celery_task_id = Column(String, nullable=True)

    retry_count = Column(Integer, nullable=False, default=0, server_default=text("0"))
    max_retries = Column(Integer, nullable=False, default=3, server_default=text("3"))

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    story = relationship("Story", back_populates="jobs")
    chapter = relationship("Chapter", back_populates="jobs")
