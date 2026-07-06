import json, re, logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from app.providers import PROVIDERS

logger = logging.getLogger("traductor")

router = APIRouter()

Modo = Literal[
    "traducir_estandar", "traducir", "traducir_profesional",
    "traducir_coloquial", "resumir", "traducir_resumir"
]
Nivel = Literal["breve", "normal", "detallado"]


class ProcessPayload(BaseModel):
    texto: str
    origen: str = "auto"
    destino: str = "es"
    modo: Modo = "traducir_resumir"
    nivelResumen: Nivel = "normal"


DETALLE_MAP: dict[Nivel, str] = {
    "breve": "muy breve (1-3 frases)",
    "normal": "de longitud media (3-6 frases)",
    "detallado": "detallado pero conciso (varios párrafos breves)",
}

PROVIDERS_TO_TRY = ["groq", "gemini", "ollama", "openrouter", "openai"]


def build_system_prompt(modo: Modo, origen: str, destino: str, nivel: Nivel) -> str:
    detalle = DETALLE_MAP[nivel]
    system_prompt = ""
    if modo == "traducir_estandar":
        system_prompt = f"Realiza una traducción ESTÁNDAR y equilibrada de {origen} a {destino}. Debe ser correcta, clara y neutra.\ntraduccion = <texto traducido>, resumen = \"\""
    elif modo == "traducir":
        system_prompt = f"Realiza una traducción ORIGINAL de {origen} a {destino}. Debe ser NATURAL y fluida, respetando el estilo original del autor.\ntraduccion = <texto traducido>, resumen = \"\""
    elif modo == "traducir_profesional":
        system_prompt = f"Eres un traductor de alto nivel. Realiza una traducción PROFESIONAL, CRÍTICA y EXPERTA de {origen} a {destino}. Usa un tono formal, técnico y preciso.\ntraduccion = <texto traducido>, resumen = \"\""
    elif modo == "traducir_coloquial":
        system_prompt = f"Realiza una traducción COLOQUIAL, SENCILLA y BREVE de {origen} a {destino}. Usa un lenguaje directo y cotidiano.\ntraduccion = <texto traducido>, resumen = \"\""
    elif modo == "resumir":
        system_prompt = f"No traduzcas. Resume el texto en su idioma original ({origen}).\nNivel de resumen: {detalle}.\ntraduccion = \"\", resumen = <resumen>"
    elif modo == "traducir_resumir":
        system_prompt = f"Primero traduce al idioma {destino} y luego haz el resumen SOBRE EL TEXTO TRADUCIDO.\nNivel de resumen: {detalle}.\ntraduccion = <traducción>, resumen = <resumen>"

    return f"""
Eres un asistente experto en traducción y resumen.
Devuelves SIEMPRE un JSON válido con esta forma:
{{
  "traduccion": "...",
  "resumen": "..."
}}
Instrucción específica: {system_prompt}
- Si el idioma origen es "auto", detecta el idioma tú mismo.
- No añadas explicaciones fuera del JSON.
    """.strip()


@router.post("/process")
async def process_text(payload: ProcessPayload):
    if not payload.texto or not payload.texto.strip():
        raise HTTPException(400, "Texto vacío")

    system = build_system_prompt(payload.modo, payload.origen, payload.destino, payload.nivelResumen)

    last_error: str | None = None
    successful_provider = ""
    parsed: dict | None = None

    for provider_name in PROVIDERS_TO_TRY:
        try:
            logger.info(f"[process] Intentando proveedor: {provider_name}")
            provider = PROVIDERS[provider_name]()
            completion = await provider.create_completion(
                model=provider.model,
                temperature=0.2,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": json.dumps({
                        "texto": payload.texto,
                        "origen": payload.origen,
                        "destino": payload.destino,
                        "modo": payload.modo,
                        "nivelResumen": payload.nivelResumen,
                    })},
                ],
            )
            raw = completion.choices[0].message.content or "{}"
            match = re.search(r"\{[\s\S]*\}", raw)
            parsed = json.loads(match.group(0) if match else raw)
            successful_provider = provider_name
            logger.info(f"[process] Completado con éxito usando proveedor: {provider_name}")
            break
        except Exception as e:
            logger.warning(f"[process] Proveedor {provider_name} falló: {e}")
            last_error = str(e)

    if not parsed:
        raise HTTPException(502, f"Todos los proveedores de IA fallaron: {last_error}")

    return {
        "traduccion": parsed.get("traduccion", ""),
        "resumen": parsed.get("resumen", ""),
        "provider": successful_provider,
    }
