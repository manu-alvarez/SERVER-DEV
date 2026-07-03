"""
JartosDTo — Application Configuration.

Centralized settings loaded from environment variables via pydantic-settings.
"""

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── General ──────────────────────────────────────────
    app_name: str = "JartosDTo"
    debug: bool = True
    api_url: str = "http://localhost:8100"
    cors_origins: list[str] = ["http://localhost:3100"]

    # ── Auth ─────────────────────────────────────────────
    jwt_secret: str = "change-me-to-a-random-64-char-string"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 1440  # 24 hours
    admin_email: str = "admin@jartosdto.local"
    admin_password: str = "changeme"

    # ── Database ─────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://jartosdto:jartosdto_secret@localhost:5432/jartosdto"

    # ── Redis ────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── MinIO ────────────────────────────────────────────
    minio_endpoint: str = "localhost:9010"
    minio_root_user: str = "jartosdto"
    minio_root_password: str = "jartosdto_secret"
    minio_bucket: str = "uploads"
    minio_secure: bool = False

    # ── LLM Provider Keys ────────────────────────────────
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    mistral_api_key: Optional[str] = None

    # ── Local Model Runners ──────────────────────────────
    ollama_base_url: str = "http://host.docker.internal:11434"
    vllm_base_url: str = "http://host.docker.internal:8001"
    lmstudio_base_url: str = "http://host.docker.internal:1234"

    # ── Web Search ───────────────────────────────────────
    tavily_api_key: Optional[str] = None
    searxng_base_url: str = "http://searxng:8080"

    # ── Embeddings ───────────────────────────────────────
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536

    # ── Sandbox ──────────────────────────────────────────
    sandbox_enabled: bool = True
    sandbox_timeout_seconds: int = 30
    sandbox_memory_limit_mb: int = 256


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings singleton."""
    return Settings()
