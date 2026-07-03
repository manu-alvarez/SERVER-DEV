from __future__ import annotations

import base64
import logging
import httpx
import asyncio
from io import BytesIO
from urllib.parse import quote

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import compute_prompt_hash
from app.models.orm import Story, Chapter, PromptCache
from app.services.storage import upload_to_storage

logger = logging.getLogger(__name__)
settings = get_settings()


async def _retry_with_backoff(func, max_retries: int = 3, base_delay: float = 5.0, operation_name: str = "operation"):
    """Execute an async function with exponential backoff retry logic.
    Retries on transient errors (timeout, connection). Non-retryable errors (HTTP 402 etc.)
    are re-raised immediately so the caller can attempt a fallback provider."""
    for attempt in range(max_retries):
        try:
            return await func()
        except (httpx.ReadTimeout, httpx.ConnectError, httpx.RemoteProtocolError) as e:
            delay = base_delay * (2 ** attempt)
            logger.warning(f"{operation_name} failed (attempt {attempt + 1}/{max_retries}): {e}. Retrying in {delay}s...")
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(delay)
        except (httpx.HTTPStatusError, httpx.HTTPError) as e:
            logger.warning(f"{operation_name} failed with HTTP error (attempt {attempt + 1}): {e}. Triggering fallback.")
            raise


async def generate_images_for_story(session: AsyncSession, story_id: str) -> None:
    """Generate images for all chapters of a story using free providers."""
    logger.info(f"Generating images for story_id={story_id}")

    result = await session.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()
    if not story:
        logger.error(f"Story not found: {story_id}")
        return

    canonical = story.canonical_character_description
    if not canonical:
        logger.warning(f"No canonical character description for story_id={story_id}, using generic style")
        canonical = "Children's book illustration style, warm colors, friendly characters"

    chapters_result = await session.execute(
        select(Chapter)
        .where(Chapter.story_id == story_id)
        .order_by(Chapter.chapter_number)
    )
    chapters = chapters_result.scalars().all()

    if not chapters:
        logger.warning(f"No chapters found for story_id={story_id}")
        return

    provider = settings.IMAGE_PROVIDER

    for chapter in chapters:
        if chapter.url_image:
            logger.info(f"Chapter {chapter.chapter_number} already has image, skipping")
            continue

        chapter.image_status = "processing"
        await session.commit()

        prompt = _build_image_prompt(canonical, chapter)
        provider_id = f"{provider}:image"

        # Check cache
        prompt_hash = compute_prompt_hash(prompt, provider_id, "image")
        cached = await _get_cached_prompt(session, prompt_hash)
        if cached:
            logger.info(f"Using cached image for chapter {chapter.chapter_number}")
            chapter.url_image = cached["payload"].get("url", "")
            chapter.image_status = "done"
            await session.commit()
            continue

        try:
            image_url = None
            last_error = None

            # Try primary provider
            try:
                async def generate_primary():
                    if provider == "pollinations" or provider not in ["huggingface", "openai"]:
                        return await _generate_pollinations(prompt, story_id, chapter.chapter_number, session)
                    elif provider == "huggingface":
                        return await _generate_huggingface(prompt, story_id, chapter.chapter_number, session)
                    elif provider == "openai":
                        return await _generate_openai(prompt, story_id, chapter.chapter_number, session)
                    return await _generate_pollinations(prompt, story_id, chapter.chapter_number, session)

                image_url = await _retry_with_backoff(
                    generate_primary, 
                    max_retries=2, 
                    base_delay=5.0, 
                    operation_name=f"Primary provider ({provider}) for chapter {chapter.chapter_number}"
                )
            except Exception as e:
                last_error = e
                logger.warning(f"Primary provider failed for chapter {chapter.chapter_number}: {e}")

            # Fallback to secondary provider if primary failed
            if not image_url:
                secondary = "huggingface" if provider != "huggingface" else "pollinations"
                logger.info(f"Attempting fallback to {secondary} for chapter {chapter.chapter_number}")
                
                try:
                    async def generate_secondary():
                        if secondary == "pollinations":
                            return await _generate_pollinations(prompt, story_id, chapter.chapter_number, session)
                        elif secondary == "huggingface":
                            return await _generate_huggingface(prompt, story_id, chapter.chapter_number, session)
                        return None

                    image_url = await _retry_with_backoff(
                        generate_secondary, 
                        max_retries=2, 
                        base_delay=10.0, 
                        operation_name=f"Secondary provider ({secondary}) for chapter {chapter.chapter_number}"
                    )
                except Exception as e:
                    logger.error(f"Secondary provider also failed for chapter {chapter.chapter_number}: {e}")
                    raise last_error or e # Raise the original error if secondary also fails

            if not image_url:
                raise ValueError("Image generation failed on all providers")

            chapter.url_image = image_url
            chapter.image_status = "done"

            # Cache result
            await _cache_prompt(session, prompt_hash, provider_id, "image",
                               {"url": chapter.url_image})

        except Exception as e:
            logger.error(f"Failed to generate image for chapter {chapter.chapter_number}: {e}")
            chapter.image_status = "failed"

        await session.commit()

    # Update story status unconditionally to unblock the pipeline
    story.images_generated = True
    await session.commit()


async def _generate_pollinations(prompt: str, story_id: str, chapter_num: int,
                                 session: AsyncSession) -> str:
    """Generate image using Pollinations.ai (100% free, no API key)."""
    # Pollinations returns image directly via URL
    encoded_prompt = quote(prompt, safe="")
    base_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&seed=42&nologo=true"
    
    # Add API key if configured for higher limits
    if settings.POLLINATIONS_API_KEY:
        base_url += f"&token={settings.POLLINATIONS_API_KEY}"

    image_url = base_url

    # Download and upload to storage for persistence
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.get(image_url)
        response.raise_for_status()

        image_bytes = BytesIO(response.content)
        file_path = f"stories/{story_id}/chapters/{chapter_num}.png"
        storage_url = await upload_to_storage(image_bytes, file_path, "image/png")
        return storage_url


async def _generate_huggingface(prompt: str, story_id: str, chapter_num: int,
                                session: AsyncSession) -> str:
    """Generate image using Hugging Face Inference API (free tier).
    Uses AsyncInferenceClient with FLUX.1-schnell for fast, high-quality generation."""
    from huggingface_hub import AsyncInferenceClient

    client = AsyncInferenceClient(token=settings.HUGGINGFACE_TOKEN)
    
    image = await client.text_to_image(
        prompt,
        model="black-forest-labs/FLUX.1-schnell",
    )

    buffer = BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)

    file_path = f"stories/{story_id}/chapters/{chapter_num}.png"
    storage_url = await upload_to_storage(buffer, file_path, "image/png")
    return storage_url


async def _generate_openai(prompt: str, story_id: str, chapter_num: int,
                           session: AsyncSession) -> str:
    """Generate image using OpenAI DALL-E 3."""
    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    response = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size="1024x1024",
        quality="standard",
        style="natural",
        n=1,
    )

    image_url = response.data[0].url
    image_b64 = response.data[0].b64_json

    if image_b64:
        image_bytes = BytesIO(base64.b64decode(image_b64))
    else:
        # Download from URL
        async with httpx.AsyncClient(timeout=60) as http_client:
            img_resp = await http_client.get(image_url)
            image_bytes = BytesIO(img_resp.content)

    file_path = f"stories/{story_id}/chapters/{chapter_num}.png"
    storage_url = await upload_to_storage(image_bytes, file_path, "image/png")
    return storage_url


def _build_image_prompt(canonical: str, chapter: Chapter) -> str:
    """Build a detailed image prompt ensuring character consistency."""
    return (
        f"{canonical}. "
        f"Illustration for chapter {chapter.chapter_number}: {chapter.chapter_title}. "
        f"Scene: {chapter.image_prompt}. "
        f"Style: children's book illustration, soft watercolor textures, warm lighting, "
        f"consistent character appearance across all chapters, magical atmosphere, "
        f"age-appropriate and family-friendly."
    )


async def _get_cached_prompt(session: AsyncSession, prompt_hash: str) -> dict | None:
    """Retrieve cached image result."""
    result = await session.execute(
        select(PromptCache).where(PromptCache.prompt_hash == prompt_hash)
    )
    cached = result.scalar_one_or_none()
    if cached:
        return {"payload": cached.payload}
    return None


async def _cache_prompt(session: AsyncSession, prompt_hash: str, provider: str,
                       output_type: str, payload: dict) -> None:
    """Cache image generation result."""
    from app.services.story_planner import _get_cached_prompt as get_cached
    existing = await get_cached(session, prompt_hash)
    if existing:
        return

    cache_entry = PromptCache(
        prompt_hash=prompt_hash,
        provider=provider,
        output_type=output_type,
        payload=payload,
    )
    session.add(cache_entry)
