from __future__ import annotations

import os
import base64
import logging
import asyncio
import subprocess
import tempfile
from io import BytesIO

import httpx
import edge_tts
from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import compute_prompt_hash
from app.models.orm import Story, Chapter, PromptCache
from app.services.storage import upload_to_storage

logger = logging.getLogger(__name__)
settings = get_settings()

# Edge TTS voice mapping (OpenAI voice names -> Edge TTS voices)
VOICE_MAP = {
    "alloy": "en-US-GuyNeural",
    "echo": "en-US-JennyNeural",
    "fable": "en-GB-SoniaNeural",
    "onyx": "en-US-DavisNeural",
    "nova": "en-US-AriaNeural",
    "shimmer": "en-US-MichelleNeural",
    # Spanish voices for Spanish stories
    "es-male": "es-ES-AlvaroNeural",
    "es-female": "es-ES-ElviraNeural",
}

# OpenAI voice names mapping
OPENAI_VOICE_MAP = {
    "es-female": "nova",
    "es-male": "onyx",
    "alloy": "alloy",
    "echo": "echo",
    "fable": "fable",
    "onyx": "onyx",
    "nova": "nova",
    "shimmer": "shimmer",
}

# Fallback voice chain for Spanish (order matters)
SPANISH_VOICE_CHAIN = [
    "es-ES-ElviraNeural",
    "es-ES-AlvaroNeural",
    "es-MX-DaliaNeural",
    "es-AR-ElenaNeural",
    "es-CO-SalomeNeural",
]

# Gemini 2.0 Flash TTS endpoint
GEMINI_TTS_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-3.1-flash-tts:generateContent"
)

# Professional storyteller system prompt for Gemini TTS
STORYTELLER_SYSTEM_INSTRUCTION = (
    "Eres un actor de voz experto y un cuentacuentos profesional. "
    "Tu objetivo es narrar cuentos infantiles con una expresividad, magia y calidez excepcionales. "
    "Esta estrictamente prohibido el tono robotico o plano. "
    "Inyecta emocion, asombro y energia real en cada frase. "
    "Varia la velocidad de lectura organicamente: introduce pausas dramaticas para generar anticipacion, "
    "acelera en momentos de aventura y utiliza un tono susurrado y calmado en las transiciones o al final del cuento. "
    "Remarca fuertemente las palabras clave descriptivas alterando sutilmente el volumen o la intensidad de la voz. "
    "Modula la inflexion y el tono para distinguir claramente la voz del narrador de las lineas de dialogo de los personajes. "
    "Transmite la intencion emocional de cada escena. "
    "El resultado final debe sonar exactamente como una interpretacion en vivo disenada para cautivar la imaginacion "
    "y mantener la atencion absoluta del nino que escucha."
)

# PCM format: 24kHz, 16-bit signed, single channel (mono)
PCM_SAMPLE_RATE = 24000
PCM_SAMPLE_WIDTH = 2  # 16-bit
PCM_CHANNELS = 1


async def _retry_with_backoff(func, max_retries: int = 3, base_delay: float = 3.0, operation_name: str = "operation"):
    """Execute an async function with exponential backoff retry logic."""
    for attempt in range(max_retries):
        try:
            return await func()
        except (ConnectionError, TimeoutError, OSError, RuntimeError) as e:
            delay = base_delay * (2 ** attempt)
            logger.warning(f"{operation_name} failed (attempt {attempt + 1}/{max_retries}): {e}. Retrying in {delay}s...")
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(delay)
        except Exception as e:
            logger.error(f"{operation_name} failed with non-retryable error: {e}")
            raise


def _preprocess_story_text_for_narration(text: str) -> str:
    """Preprocess story text to optimize for natural narration.

    Adds strategic punctuation and formatting cues that Gemini TTS interprets
    for better pacing, pauses, and emphasis.
    """
    # Ensure proper sentence endings for natural pauses
    text = text.strip()
    if not text.endswith(('.', '!', '?', '...')):
        text += '.'

    # Add dramatic pause markers before dialogue (Gemini interprets em-dashes)
    # Replace quotes with em-dash style for better narration flow
    text = text.replace('"', '\u2014 ')

    # Ensure ellipsis for dramatic moments (Gemini pauses on ...)
    # Don't overdo it - only add where naturally appropriate
    text = text.replace('...', '... ')

    # Add paragraph breaks as natural pause points
    text = text.replace('\n\n', '\n\n... ')

    return text


async def _generate_openai_tts(text: str, voice_name: str | None = None, speed: float | None = None) -> bytes:
    """Generate audio using OpenAI TTS API (tts-1 model)."""
    voice = voice_name or settings.OPENAI_TTS_VOICE or "alloy"
    voice = OPENAI_VOICE_MAP.get(voice, "alloy")
    speed_val = speed or settings.OPENAI_TTS_SPEED or 0.9

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def _call_api():
        response = await client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text,
            speed=speed_val,
            response_format="mp3"
        )
        return response.content

    return await _retry_with_backoff(
        _call_api,
        max_retries=3,
        base_delay=2.0,
        operation_name=f"OpenAI TTS (voice: {voice}, speed: {speed_val})"
    )


async def _generate_gemini_tts(text: str, voice_name: str | None = None) -> bytes:
    """Generate audio using Gemini 2.5 Flash TTS (native audio model via Gemini API).

    Returns MP3 bytes converted from raw PCM (24kHz, 16-bit, mono).

    Uses professional storyteller system instruction for:
    - Expressive, warm narration (no robotic tone)
    - Dynamic pacing (dramatic pauses, acceleration in action, whispers in transitions)
    - Strategic emphasis on descriptive keywords
    - Character voice differentiation
    - Emotional immersion for child engagement
    """
    voice_name = voice_name or settings.GEMINI_TTS_VOICE
    url = f"{GEMINI_TTS_ENDPOINT}?key={settings.GOOGLE_API_KEY}"

    # Preprocess text for optimal narration
    narrated_text = _preprocess_story_text_for_narration(text)

    payload = {
        "systemInstruction": {
            "parts": [{"text": STORYTELLER_SYSTEM_INSTRUCTION}]
        },
        "contents": [{
            "role": "user",
            "parts": [{"text": narrated_text}]
        }],
        "generationConfig": {
            "responseModalities": ["audio"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {
                        "voiceName": voice_name
                    }
                }
            }
        }
    }

    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()

    # Extract PCM audio from response candidates
    candidates = data.get("candidates", [])
    if not candidates:
        raise ValueError("Gemini TTS returned no candidates")

    for candidate in candidates:
        parts = candidate.get("content", {}).get("parts", [])
        for part in parts:
            inline_data = part.get("inlineData", {})
            mime = inline_data.get("mimeType", "")
            if "pcm" in mime or "L16" in mime:
                pcm_bytes = base64.b64decode(inline_data["data"])
                return _pcm_to_mp3(pcm_bytes)

    raise ValueError("No PCM audio data found in Gemini TTS response")


def _pcm_to_mp3(pcm_bytes: bytes) -> bytes:
    """Convert raw PCM (24kHz, 16-bit, mono) to MP3 bytes via ffmpeg."""
    with tempfile.NamedTemporaryFile(suffix=".pcm", delete=False) as f:
        f.write(pcm_bytes)
        pcm_path = f.name

    try:
        result = subprocess.run(
            ["ffmpeg", "-y",
             "-f", "s16le", "-ar", str(PCM_SAMPLE_RATE), "-ac", str(PCM_CHANNELS),
             "-i", pcm_path,
             "-codec:a", "libmp3lame", "-b:a", "32k",
             "-f", "mp3", "pipe:1"],
            capture_output=True, check=True
        )
        return result.stdout
    finally:
        os.unlink(pcm_path)


async def generate_audio_for_story(session: AsyncSession, story_id: str) -> None:
    """Generate TTS audio for all chapters using high fidelity voice chain (OpenAI -> Gemini -> Edge)."""
    logger.info(f"Generating audio for story_id={story_id}")

    result = await session.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()
    if not story:
        logger.error(f"Story not found: {story_id}")
        return

    chapters_result = await session.execute(
        select(Chapter)
        .where(Chapter.story_id == story_id)
        .order_by(Chapter.chapter_number)
    )
    chapters = chapters_result.scalars().all()

    if not chapters:
        logger.warning(f"No chapters found for story_id={story_id}")
        return

    lang = story.target_language or "es"

    for chapter in chapters:
        if chapter.url_audio:
            logger.info(f"Chapter {chapter.chapter_number} already has audio, skipping")
            continue

        chapter.audio_status = "processing"
        await session.commit()

        text = chapter.chapter_text
        voice_key = (chapter.audio_settings or {}).get("voice", settings.OPENAI_TTS_VOICE)
        speed = (chapter.audio_settings or {}).get("speed", settings.OPENAI_TTS_SPEED)

        # Plan the primary provider and voice to compute cache hash
        if settings.OPENAI_API_KEY:
            voice_to_use = voice_key
            if lang.startswith("es"):
                if "female" in voice_to_use or voice_to_use == "alloy":
                    voice_to_use = "nova"
                elif "male" in voice_to_use:
                    voice_to_use = "onyx"
            openai_voice = OPENAI_VOICE_MAP.get(voice_to_use, "nova")
            provider_id = f"openai-tts:{openai_voice}"
        elif settings.GOOGLE_API_KEY:
            provider_id = f"gemini-tts:{settings.GEMINI_TTS_VOICE}"
        else:
            if lang.startswith("es"):
                default_voice = "es-ES-ElviraNeural" if "female" in voice_key or voice_key == "alloy" else "es-ES-AlvaroNeural"
            else:
                default_voice = VOICE_MAP.get(voice_key, "en-US-JennyNeural")
            provider_id = f"edge-tts:{default_voice}"

        # Check cache
        prompt_hash = compute_prompt_hash(text, provider_id, "audio")
        cached = await _get_cached_prompt(session, prompt_hash)
        if cached:
            logger.info(f"Using cached audio for chapter {chapter.chapter_number}")
            chapter.url_audio = cached["payload"].get("url", "")
            chapter.audio_status = "done"
            await session.commit()
            continue

        try:
            audio_bytes = None
            last_error = None

            # 1. Primary: OpenAI TTS
            if settings.OPENAI_API_KEY:
                try:
                    voice_to_use = voice_key
                    if lang.startswith("es"):
                        if "female" in voice_to_use or voice_to_use == "alloy":
                            voice_to_use = "nova"
                        elif "male" in voice_to_use:
                            voice_to_use = "onyx"
                    openai_voice = OPENAI_VOICE_MAP.get(voice_to_use, "nova")
                    logger.info(f"Using OpenAI TTS (voice: {openai_voice}, speed: {speed}) for chapter {chapter.chapter_number}")
                    audio_bytes = await _generate_openai_tts(text, voice_name=openai_voice, speed=speed)
                    provider_id = f"openai-tts:{openai_voice}"
                except Exception as e:
                    logger.warning(f"OpenAI TTS failed for chapter {chapter.chapter_number}, falling back: {e}")
                    last_error = e

            # 2. Secondary Fallback: Gemini TTS (multimodal)
            if not audio_bytes and settings.GOOGLE_API_KEY:
                try:
                    logger.info(f"Using Gemini TTS (voice: {settings.GEMINI_TTS_VOICE}) for chapter {chapter.chapter_number}")
                    audio_bytes = await _generate_gemini_tts(text, voice_name=settings.GEMINI_TTS_VOICE)
                    provider_id = f"gemini-tts:{settings.GEMINI_TTS_VOICE}"
                except Exception as e:
                    logger.warning(f"Gemini TTS failed for chapter {chapter.chapter_number}, falling back: {e}")
                    last_error = e

            # 3. Tertiary Fallback: Edge TTS (free)
            if not audio_bytes:
                logger.info(f"Using edge-tts for chapter {chapter.chapter_number}")
                try:
                    if lang.startswith("es"):
                        default_voice = "es-ES-ElviraNeural" if "female" in voice_key or voice_key == "alloy" else "es-ES-AlvaroNeural"
                    else:
                        default_voice = VOICE_MAP.get(voice_key, "en-US-JennyNeural")

                    async def generate_with_voice(voice_to_use: str):
                        # Optimize speed rate for Edge-TTS (avoid extreme time stretch which sounds metallic/robotic)
                        edge_speed = speed
                        if edge_speed < 1.0:
                            edge_speed = max(0.95, edge_speed)  # Smooth slower speed
                        elif edge_speed > 1.0:
                            edge_speed = min(1.05, edge_speed)  # Smooth faster speed
                        
                        rate_pct = int((edge_speed - 1) * 100)
                        rate_str = f"{rate_pct:+}%" if rate_pct != 0 else "+0%"
                        
                        communicate = edge_tts.Communicate(text, voice_to_use, rate=rate_str)
                        audio_buffer = BytesIO()
                        async for chunk in communicate.stream():
                            if chunk["type"] == "audio":
                                audio_buffer.write(chunk["data"])
                        audio_buffer.seek(0)
                        return audio_buffer.getvalue()


                    voice_chain = [default_voice]
                    if lang.startswith("es"):
                        voice_chain = [v for v in SPANISH_VOICE_CHAIN if v != default_voice]
                        voice_chain.insert(0, default_voice)

                    for voice_attempt in voice_chain:
                        try:
                            audio_bytes = await _retry_with_backoff(
                                lambda v=voice_attempt: generate_with_voice(v),
                                max_retries=2,
                                base_delay=3.0,
                                operation_name=f"Edge-TTS voice {voice_attempt} for chapter {chapter.chapter_number}"
                            )
                            if audio_bytes:
                                provider_id = f"edge-tts:{voice_attempt}"
                                break
                        except Exception as e:
                            last_error = e
                            logger.warning(f"Edge-TTS voice {voice_attempt} failed: {e}")
                            continue
                except Exception as e:
                    logger.error(f"Edge-TTS completely failed: {e}")
                    last_error = e

            if not audio_bytes:
                raise last_error or ValueError("Audio generation failed on all providers")

            file_path = f"stories/{story_id}/chapters/{chapter.chapter_number}.mp3"
            storage_url = await upload_to_storage(audio_bytes, file_path, "audio/mpeg")
            chapter.url_audio = storage_url
            chapter.audio_status = "done"

            # Cache result
            await _cache_prompt(session, prompt_hash, provider_id,
                               "audio", {"url": storage_url})

        except Exception as e:
            logger.error(f"Failed to generate audio for chapter {chapter.chapter_number}: {e}")
            chapter.audio_status = "failed"

        await session.commit()

    # Update story status unconditionally to unblock the pipeline
    story.audio_generated = True
    await session.commit()


async def _get_cached_prompt(session: AsyncSession, prompt_hash: str) -> dict | None:
    """Retrieve cached audio result."""
    result = await session.execute(
        select(PromptCache).where(PromptCache.prompt_hash == prompt_hash)
    )
    cached = result.scalar_one_or_none()
    if cached:
        return {"payload": cached.payload}
    return None


async def _cache_prompt(session: AsyncSession, prompt_hash: str, provider: str,
                       output_type: str, payload: dict) -> None:
    """Cache audio generation result."""
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
