from openai import AsyncOpenAI
from app.config import settings


class AIProvider:
    def __init__(self, client: AsyncOpenAI, model: str):
        self.client = client
        self.model = model

    async def create_completion(self, **kwargs):
        return await self.client.chat.completions.create(**kwargs)


def create_groq() -> AIProvider:
    return AIProvider(
        AsyncOpenAI(api_key=settings.groq_api_key, base_url="https://api.groq.com/openai/v1"),
        "llama-3.3-70b-versatile",
    )


def create_openai() -> AIProvider:
    return AIProvider(
        AsyncOpenAI(api_key=settings.openai_api_key),
        "gpt-4o",
    )


def create_gemini() -> AIProvider:
    return AIProvider(
        AsyncOpenAI(api_key=settings.google_api_key, base_url="https://generativelanguage.googleapis.com/v1beta/openai/"),
        "gemini-3.1-flash-lite",
    )


def create_openrouter() -> AIProvider:
    return AIProvider(
        AsyncOpenAI(api_key=settings.openrouter_api_key, base_url="https://openrouter.ai/api/v1"),
        "meta-llama/llama-3.3-70b-instruct",
    )


def create_ollama() -> AIProvider:
    return AIProvider(
        AsyncOpenAI(api_key="ollama", base_url=settings.ollama_base_url),
        settings.ollama_model,
    )


PROVIDERS: dict[str, callable] = {
    "groq": create_groq,
    "gemini": create_gemini,
    "ollama": create_ollama,
    "openrouter": create_openrouter,
    "openai": create_openai,
}
