import httpx
import logging

logger = logging.getLogger("msbross.models")

# Cloud models that are always available (served by api_keys_vault.json keys)
CLOUD_MODELS = [
    {"id": "gm/gemini-3.5-flash", "name": "Gemini 3.5 Flash", "provider": "Gemini", "free": True},
    {"id": "gm/gemini-3.1-pro", "name": "Gemini 3.1 Pro", "provider": "Gemini", "free": True},
    {"id": "gm/gemini-3.1-flash-lite", "name": "Gemini 3.1 Flash Lite", "provider": "Gemini", "free": True},
    {"id": "gr/llama-3.3-70b-versatile", "name": "Llama 3.3 70B", "provider": "Groq", "free": True},
    {"id": "gr/llama-3.1-8b-instant", "name": "Llama 3.1 8B Instant", "provider": "Groq", "free": True},
    {"id": "gr/mixtral-8x7b-32768", "name": "Mixtral 8x7B", "provider": "Groq", "free": True},
    {"id": "or/deepseek/deepseek-chat:free", "name": "DeepSeek V3", "provider": "OpenRouter", "free": True},
    {"id": "or/google/gemma-3-27b-it:free", "name": "Gemma 3 27B", "provider": "OpenRouter", "free": True},
]

OLLAMA_BASE_URL = "http://100.100.2.10:11434"


async def fetch_ollama_models() -> list[dict]:
    """Query Ollama API for actually running models. Returns empty list on failure."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if res.status_code == 200:
                data = res.json()
                models = []
                for m in data.get("models", []):
                    name = m.get("name", "")
                    # Clean up display name: "llama3.2:3b" -> "Llama3.2 3B"
                    display = name.replace(":", " ").replace("-", " ").title()
                    models.append({
                        "id": f"ol/{name}",
                        "name": display,
                        "provider": "Ollama",
                        "free": True,
                    })
                return models
    except Exception as e:
        logger.warning(f"Could not reach Ollama at {OLLAMA_BASE_URL}: {e}")
    return []


async def get_all_models() -> list[dict]:
    """Return cloud models + dynamically discovered Ollama models."""
    ollama_models = await fetch_ollama_models()
    return CLOUD_MODELS + ollama_models
