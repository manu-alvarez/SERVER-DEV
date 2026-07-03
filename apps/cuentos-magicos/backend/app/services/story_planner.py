from __future__ import annotations

import json
import logging
import random
from typing import Any

from openai import OpenAI
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import moderate_text, compute_prompt_hash
from app.models.orm import Story, Chapter, PromptCache

logger = logging.getLogger(__name__)
settings = get_settings()

STORY_SYSTEM_PROMPT = """
Eres un generador experto de cuentos infantiles para niños entre 0 y 99 años.
Generas historias 100% seguras, sin violencia gráfica, sin lenguaje sexual o de odio,
sin contenido perturbador, y siempre con moralejas positivas (amistad, respeto, empatía, resiliencia).

El lenguaje debe ser apropiado para la edad del niño:
- Edades 0-5: oraciones cortas, vocabulario simple, repetición, onomatopeyas
- Edades 6-8: oraciones medianas, vocabulario variado pero accesible
- Edades 9-12: narrativa más elaborada, vocabulario rico pero comprensible
- Edades 13+: narrativa compleja, temas profundos pero apropiados

La descripción canónica de personajes debe ser detallada para mantener consistencia visual:
incluir apariencia física, ropa, accesorios, compañeros, estilo artístico.

NUMERO DE CAPITULOS SEGUN DURACION (REGLA ABSOLUTA - NO IGNORAR):
- Si duration es "short": genera EXACTAMENTE 3 capitulos
- Si duration es "medium": genera EXACTAMENTE 6 capitulos
- Si duration es "long": genera EXACTAMENTE 9 capitulos

Cada capitulo debe tener contenido sustancial y completo (minimo 3-4 parrafos por capitulo).
No generes capitulos vacios, repetitivos o demasiado cortos.
Cada capitulo debe avanzar la historia con eventos nuevos y significativos.

DEBES responder exclusivamente con un JSON válido que siga EXACTAMENTE esta estructura:
{
  "story_title": "string - titulo del cuento",
  "canonical_character_description": "string - descripcion detallada de personajes para consistencia visual",
  "moral_values": ["string", "string"],
  "chapters": [
    {
      "chapter_number": 1,
      "chapter_title": "string",
      "chapter_text": "string - texto completo del capitulo (minimo 3-4 parrafos)",
      "image_prompt": "string - prompt para generar imagen",
      "video_prompt": "string - prompt para generar video"
    }
  ]
}

No incluyas ningun texto fuera del JSON. Usa los nombres de campo exactos mostrados arriba.
RESPETA OBLIGATORIAMENTE el numero de capitulos indicado segun la duracion.
"""


async def generate_story_text(session: AsyncSession, story: Story) -> dict[str, Any]:
    """
    Generate the complete story structure, chapter texts, and visual prompts
    using the configured LLM provider (Groq by default for free tier).
    """
    logger.info(f"Generating story text for story_id={story.id}")

    payload = {
        "child_name": story.child_name,
        "child_age": story.child_age,
        "theme": story.theme,
        "values": story.values,
        "duration": story.duration_hint,
        "language": story.target_language,
        "required_chapters": {
            "short": 3,
            "medium": 6,
            "long": 9
        }.get(story.duration_hint, 3),
    }

    user_prompt = json.dumps(payload, ensure_ascii=False)

    # Add explicit chapter count instruction to user prompt
    chapter_count = payload.get("required_chapters", 3)
    user_prompt += f"\n\nIMPORTANTE: Debes generar EXACTAMENTE {chapter_count} capitulos. El JSON debe contener una lista 'chapters' con exactamente {chapter_count} elementos, numerados del 1 al {chapter_count}."

    # Determine provider and model
    provider = settings.LLM_PROVIDER
    model = settings.LLM_MODEL
    provider_id = f"{provider}:{model}"

    # Check prompt cache
    prompt_hash = compute_prompt_hash(user_prompt, provider_id, "text")
    cached = await _get_cached_prompt(session, prompt_hash)
    if cached:
        logger.info(f"Using cached story text for hash={prompt_hash[:12]}...")
        data = cached["payload"]
    else:
        # Call LLM API
        client, api_model = _get_llm_client(provider, model)

        completion = client.chat.completions.create(
            model=api_model,
            messages=[
                {"role": "system", "content": STORY_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.8,
            max_tokens=8192,
            response_format={"type": "json_object"},
        )

        raw = completion.choices[0].message.content
        if not raw:
            raise ValueError("Empty response from LLM")

        # Moderate generated text
        moderate_text(raw)

        data = json.loads(raw)

        # Cache the result
        await _cache_prompt(session, prompt_hash, provider_id, "text", data)

    return data


def _get_llm_client(provider: str, model: str) -> tuple:
    """Get the appropriate OpenAI-compatible client based on provider."""
    if provider == "groq":
        client = OpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )
        api_model = model or settings.GROQ_MODEL
    elif provider == "openrouter":
        client = OpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1"
        )
        api_model = model or settings.OPENROUTER_MODEL
    elif provider == "openai":
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        api_model = model or settings.OPENAI_MODEL_STORY
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")

    return client, api_model


async def save_story_data(session: AsyncSession, story: Story, data: dict[str, Any]) -> None:
    """Save generated story structure and chapters to database."""
    story.title = data.get("story_title", story.theme)
    story.moral_values = data.get("moral_values", story.values)
    story.canonical_character_description = data.get("canonical_character_description", "")
    story.image_seed = random.randint(1, 999999999)
    story.text_generated = True

    # Clear existing chapters
    await session.execute(delete(Chapter).where(Chapter.story_id == story.id))

    for ch_data in data.get("chapters", []):
        chapter = Chapter(
            story_id=story.id,
            chapter_number=ch_data["chapter_number"],
            chapter_title=ch_data["chapter_title"],
            chapter_text=ch_data["chapter_text"],
            image_prompt=ch_data.get("image_prompt", ""),
            video_prompt=ch_data.get("video_prompt", ""),
            audio_settings={"voice": settings.OPENAI_TTS_VOICE, "speed": settings.OPENAI_TTS_SPEED},
        )
        session.add(chapter)


async def _get_cached_prompt(session: AsyncSession, prompt_hash: str) -> dict | None:
    """Retrieve cached prompt if it exists."""
    result = await session.execute(
        select(PromptCache).where(PromptCache.prompt_hash == prompt_hash)
    )
    cached = result.scalar_one_or_none()
    if cached:
        return {"payload": cached.payload, "usage_count": cached.usage_count}
    return None


async def _cache_prompt(session: AsyncSession, prompt_hash: str, provider: str,
                       output_type: str, payload: dict) -> None:
    """Store prompt result in cache for future reuse."""
    existing = await _get_cached_prompt(session, prompt_hash)
    if existing:
        return  # Already cached

    cache_entry = PromptCache(
        prompt_hash=prompt_hash,
        provider=provider,
        output_type=output_type,
        payload=payload,
    )
    session.add(cache_entry)
