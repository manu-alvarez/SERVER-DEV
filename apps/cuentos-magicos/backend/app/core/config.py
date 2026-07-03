from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os
from dotenv import load_dotenv

# Load .env file with override=True to force values over shell environment
_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
load_dotenv(_env_path, override=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_env_path,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    APP_DEBUG: bool = True
    APP_SECRET_KEY: str = "change-me-to-a-random-secret-key"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cuentos_magicos"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL_STORY: str = "gpt-4o-2024-11-20"
    OPENAI_TTS_MODEL: str = "gpt-4o-mini-tts"
    OPENAI_TTS_VOICE: str = "alloy"
    OPENAI_TTS_SPEED: float = 0.9

    # LLM Provider fallback chain (order matters)
    LLM_PROVIDER: str = "groq"  # groq, openrouter, google, openai
    LLM_MODEL: str = "llama-3.3-70b-versatile"

    # Google AI Studio
    GOOGLE_API_KEY: str = ""
    GOOGLE_MODEL: str = "gemini-3.1-flash-tts"
    
    # Gemini TTS (native audio model via Gemini API)
    # Voices: Puck (warm/storytelling), Charon (deep/authoritative), Kore (balanced), Fenrir (energetic)
    GEMINI_TTS_VOICE: str = "Puck"
    
    # Google Cloud TTS
    GOOGLE_TTS_API_KEY: str = ""

    # Groq
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # OpenRouter
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "meta-llama/llama-3.3-70b-instruct:free"

    # Mistral
    MISTRAL_API_KEY: str = ""
    MISTRAL_MODEL: str = "mistral-small-latest"

    # MiniMax
    MINIMAX_API_KEY: str = ""

    # Image generation
    IMAGE_PROVIDER: str = "pollinations"
    POLLINATIONS_API_KEY: str = ""
    FAL_AI_KEY: str = ""
    HUGGINGFACE_TOKEN: str = ""
    COMFYUI_API_KEY: str = ""

    # Video generation
    KLING_ACCESS_KEY: str = ""
    KLING_SECRET_KEY: str = ""
    PIKA_API_KEY: str = ""
    SILICONFLOW_API_KEY: str = ""
    LUMA_API_KEY: str = ""
    RUNWAY_API_KEY: str = ""
    STABILITY_AI_KEY: str = ""

    # Storage
    STORAGE_PROVIDER: str = "supabase"
    STORAGE_BUCKET: str = "cuentos-magicos"
    STORAGE_PUBLIC_URL: str = ""
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""
    AWS_S3_REGION: str = "us-east-1"

    # Moderation
    MODERATION_PROVIDER: str = "openai"
    MODERATION_MODEL: str = "omni-moderation-latest"

    # Tier limits (free tier defaults)
    # Chapter counts: short=3, medium=6, long=9
    TIER_FREE_MAX_CHAPTERS: int = 3
    TIER_FREE_IMAGE_SIZE: str = "768x768"
    TIER_FREE_VIDEO_ENABLED: bool = True  # Enabled with local ffmpeg fallback
    TIER_PRO_MAX_CHAPTERS: int = 6
    TIER_PRO_IMAGE_SIZE: str = "1024x1024"
    TIER_PRO_VIDEO_ENABLED: bool = True
    TIER_ENTERPRISE_MAX_CHAPTERS: int = 9
    TIER_ENTERPRISE_IMAGE_SIZE: str = "1024x1792"
    TIER_ENTERPRISE_VIDEO_ENABLED: bool = True

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"


@lru_cache()
def get_settings() -> Settings:
    """Cached singleton for settings."""
    return Settings()
