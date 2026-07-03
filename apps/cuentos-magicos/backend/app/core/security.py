from __future__ import annotations

import hashlib
import json
import logging
import re
from typing import Any

from openai import OpenAI
from fastapi import HTTPException, status

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Simple rule-based moderation fallback for when OpenAI quota is exceeded
UNSAFE_PATTERNS = [
    r'\b(kill|murder|die|death|blood|gore|sex|naked|nude|porn)\b',
    r'\b(hate|racist|slur|abuse|torture|violence)\b',
]


def _rule_based_moderation(text: str) -> dict[str, Any]:
    """Basic safety check using keyword patterns."""
    text_lower = text.lower()
    flagged = []

    for pattern in UNSAFE_PATTERNS:
        if re.search(pattern, text_lower):
            flagged.append(pattern.strip(r'\b()'))

    if flagged:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Content potentially unsafe. Flagged: {', '.join(flagged)}",
        )

    return {"flagged": False, "categories": {}}


def moderate_text(text: str) -> dict[str, Any]:
    """
    Check text against OpenAI moderation API.
    Falls back to rule-based moderation if OpenAI is unavailable.
    Raises HTTPException if content is flagged as unsafe for children.
    """
    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.moderations.create(
            model=settings.MODERATION_MODEL,
            input=text,
        )
        result = response.results[0]

        if result.flagged:
            flagged_categories = []
            for category, flagged in result.categories.model_dump().items():
                if flagged:
                    flagged_categories.append(category)

            logger.warning(f"Content flagged for: {flagged_categories}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Content not suitable for children. Flagged: {', '.join(flagged_categories)}",
            )

        return result.model_dump()

    except Exception as e:
        # If OpenAI fails (quota, network, etc.), use rule-based fallback
        logger.warning(f"OpenAI moderation failed ({e}), using rule-based fallback")
        return _rule_based_moderation(text)


def moderate_user_input(payload: dict[str, Any]) -> None:
    """Moderate all user-provided text fields before processing."""
    fields_to_check = []

    if isinstance(payload.get("child_name"), str):
        fields_to_check.append(payload["child_name"])
    if isinstance(payload.get("theme"), str):
        fields_to_check.append(payload["theme"])
    if isinstance(payload.get("values"), list):
        fields_to_check.extend([v for v in payload["values"] if isinstance(v, str)])

    combined = " ".join(fields_to_check)
    if combined.strip():
        moderate_text(combined)


def sanitize_story_text(text: str) -> str:
    """
    Post-generation safety check on story text.
    Returns cleaned text or raises if unsafe.
    """
    moderate_text(text)
    return text.strip()


def compute_prompt_hash(prompt: str, provider: str, output_type: str) -> str:
    """Compute a deterministic hash for prompt caching."""
    normalized = json.dumps(
        {"prompt": prompt.strip().lower(), "provider": provider, "type": output_type},
        sort_keys=True,
    )
    return hashlib.sha256(normalized.encode()).hexdigest()


def get_tier_limits(subscription_tier: str) -> dict[str, Any]:
    """Return generation limits based on user subscription tier."""
    tiers = {
        "free": {
            "max_chapters": settings.TIER_FREE_MAX_CHAPTERS,
            "image_size": settings.TIER_FREE_IMAGE_SIZE,
            "video_enabled": settings.TIER_FREE_VIDEO_ENABLED,
        },
        "pro": {
            "max_chapters": settings.TIER_PRO_MAX_CHAPTERS,
            "image_size": settings.TIER_PRO_IMAGE_SIZE,
            "video_enabled": settings.TIER_PRO_VIDEO_ENABLED,
        },
        "enterprise": {
            "max_chapters": settings.TIER_ENTERPRISE_MAX_CHAPTERS,
            "image_size": settings.TIER_ENTERPRISE_IMAGE_SIZE,
            "video_enabled": settings.TIER_ENTERPRISE_VIDEO_ENABLED,
        },
    }
    return tiers.get(subscription_tier, tiers["free"])
