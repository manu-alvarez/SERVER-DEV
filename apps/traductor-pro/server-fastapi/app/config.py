from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    port: int = 8004
    cors_origins: str = "http://localhost:5173"
    groq_api_key: str = ""
    openai_api_key: str = ""
    google_api_key: str = ""
    openrouter_api_key: str = ""
    ollama_base_url: str = "http://172.20.0.1:11434/v1"
    ollama_model: str = "gemma3:4b"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
