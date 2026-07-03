import logging
from typing import Tuple, Optional
from google import genai
from google.genai import types
from app.core.config import settings
from app.application.interfaces.ai_port import LLMPort

logger = logging.getLogger(__name__)

class GeminiAdapter(LLMPort):
    def __init__(self):
        if not settings.GOOGLE_STUDIO_API_KEY:
            raise ValueError("GOOGLE_STUDIO_API_KEY not configured")
        self.client = genai.Client(api_key=settings.GOOGLE_STUDIO_API_KEY)

    async def process_chat(self, user_text: str, history: list) -> Tuple[str, Optional[str], str]:
        try:
            contents = []
            for h in history:
                role = "user" if h["role"] == "user" else "model"
                contents.append({"role": role, "parts": [{"text": h["content"]}]})
            
            contents.append({"role": "user", "parts": [{"text": user_text}]})
            
            from datetime import datetime
            from app.core.prompts import SYSTEM_PROMPT
            now = datetime.now().strftime("%A, %d de %B de %Y, %H:%M:%S")
            dynamic_context = f"\n\n[SISTEMA]: Hoy es {now}."
            
            # Cognitive Router Logic
            live_keywords = [
                "busca", "quien", "quién", "qué", "que", "cuándo", "cuando", "dónde", "donde",
                "noticia", "noticias", "clima", "tiempo", "precio", "cotizacion", "cotización",
                "hoy", "ahora", "actual", "novedad", "novedades", "internet", "web"
            ]
            user_lower = user_text.lower()
            needs_live = any(kw in user_lower.split() or kw in user_lower for kw in live_keywords)
            
            # Special bypass for obvious math/logic
            if any(op in user_text for op in ["+", "-", "*", "/", "cuanto es"]):
                needs_live = False
                
            model_name = 'gemini-3.5-flash' if needs_live else 'gemini-3.1-flash-lite'
            
            config_args = {
                "system_instruction": SYSTEM_PROMPT + dynamic_context
            }
            if needs_live:
                config_args["tools"] = [{"google_search": {}}]
            
            logger.info(f"Cognitive Router: Selected {model_name} (needs_live={needs_live})")
            
            response = self.client.models.generate_content(
                model=model_name,
                contents=contents,
                config=types.GenerateContentConfig(**config_args)
            )
            text = response.text
            
            # Simple emotion extraction
            emotion = "neutral"
            if "😊" in text or "feliz" in text.lower(): emotion = "happy"
            elif "😔" in text or "triste" in text.lower(): emotion = "sad"
            
            return text, None, emotion
        except Exception as e:
            logger.error(f"Gemini error: {e}")
            return "Error en el motor Gemini: " + str(e), None, "sad"
