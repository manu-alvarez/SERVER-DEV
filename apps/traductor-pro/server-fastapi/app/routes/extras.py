import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.providers import PROVIDERS

logger = logging.getLogger("traductor")

router = APIRouter()

PROVIDERS_TO_TRY = ["groq", "gemini", "ollama", "openrouter", "openai"]

PROMPTS: dict[str, str] = {
    "keywords": (
        "Eres un experto analista SEO y de contenido. Tu tarea es extraer de 5 a 10 palabras clave "
        "o etiquetas (keywords) principales del texto proporcionado. Devuélvelas en una lista con "
        "viñetas separada por comas, sin explicaciones adicionales."
    ),
    "sentiment": (
        "Eres un experto en psicología y análisis de lenguaje. Tu tarea es analizar el sentimiento "
        "general (positivo, negativo, neutral) y el tono (ej: formal, sarcástico, entusiasta, urgente) "
        "del texto proporcionado. Devuelve un breve párrafo o viñetas explicando el sentimiento y el "
        "tono, sin explicaciones adicionales."
    ),
    "entities": (
        "Eres un experto en extracción de información (NER). Tu tarea es listar todas las Entidades "
        "Nombradas importantes que encuentres en el texto, categorizándolas en: Personas, "
        "Organizaciones, Lugares, y Fechas clave. Devuelve la lista jerárquica clara, omitiendo las "
        "categorías que no existan en el texto."
    ),
    "appbuilder": (
        "Eres un prestigioso Full-Stack Developer experto en crear prototipos rápidos y PWA. Tu tarea "
        "es generar el CÓDIGO de una aplicación o herramienta funcional basada en la descripción que "
        "el usuario te dará. Si el usuario pide una web, genera un archivo ÚNICO de HTML que incluya "
        "CSS (vibrante y moderno) y JS (lógica funcional). Si pide algo complejo, explica la "
        "estructura necesaria. Enfócate en código listo para copiar y usar."
    ),
}


class ExtrasPayload(BaseModel):
    texto: str
    herramienta: str


@router.post("/extras")
async def process_extras(payload: ExtrasPayload):
    if not payload.texto or not payload.texto.strip():
        raise HTTPException(400, "Texto vacío")

    system = PROMPTS.get(payload.herramienta)
    if not system:
        raise HTTPException(400, "Herramienta no válida")

    last_error: str | None = None
    successful_provider = ""
    content = ""

    for provider_name in PROVIDERS_TO_TRY:
        try:
            logger.info(f"[extras] Intentando proveedor: {provider_name}")
            provider = PROVIDERS[provider_name]()
            completion = await provider.create_completion(
                model=provider.model,
                temperature=0.3,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": payload.texto},
                ],
            )
            content = completion.choices[0].message.content or ""
            successful_provider = provider_name
            logger.info(f"[extras] Completado con éxito usando proveedor: {provider_name}")
            break
        except Exception as e:
            logger.warning(f"[extras] Proveedor {provider_name} falló: {e}")
            last_error = str(e)

    if not content:
        raise HTTPException(502, f"Todos los proveedores de IA fallaron para extras: {last_error}")

    return {"resultado": content.strip(), "provider": successful_provider}
