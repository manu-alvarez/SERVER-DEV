import logging
from typing import Tuple, Optional
from app.application.interfaces.ai_port import LLMPort

logger = logging.getLogger(__name__)

class FallbackLLMAdapter(LLMPort):
    """
    Sistema multi-LLM fallback para IAPuta OS.
    Intenta ejecutar process_chat en los adaptadores en orden.
    Si uno falla o lanza excepción, salta silenciosamente al siguiente de respaldo.
    """
    def __init__(self, adapters: list[LLMPort]):
        if not adapters:
            raise ValueError("Se requiere al menos un adaptador LLM")
        self.adapters = adapters

    async def process_chat(self, user_text: str, history: list) -> Tuple[str, Optional[str], str]:
        errors = []
        for index, adapter in enumerate(self.adapters):
            try:
                adapter_name = adapter.__class__.__name__
                logger.info(f"FallbackLLMAdapter: Intentando con {adapter_name}")
                text, v_url, emotion = await adapter.process_chat(user_text, history)
                
                # If Gemini returned its internal handled error string, we treat it as an error to trigger fallback
                if text.startswith("Error en el motor"):
                    raise RuntimeError(text)
                    
                return text, v_url, emotion
            except Exception as e:
                logger.warning(f"FallbackLLMAdapter: Falló {adapter.__class__.__name__}: {str(e)}")
                errors.append(f"{adapter.__class__.__name__}: {str(e)}")
                continue
                
        # Si todos fallan
        logger.error(f"FallbackLLMAdapter: Todos los modelos de respaldo fallaron. Errores: {errors}")
        return "Mis servidores externos están sufriendo una saturación cuántica en este momento. Sigo en línea, pero necesito un instante para reconectar. ¿Hablamos en un minuto?", None, "sad"
