import os
import platform
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List

class Settings(BaseSettings):
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: str = "*"
    OS_TYPE: str = platform.system()
    GROQ_API_KEY: str = ""
    TAVILY_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY_2: Optional[str] = None
    OPENROUTER_API_KEY_3: Optional[str] = None
    IAPUTA_API_KEY: Optional[str] = None
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_DEFAULT_CHAT_ID: Optional[str] = None
    MICROSOFT_CLIENT_ID: Optional[str] = None
    MICROSOFT_CLIENT_SECRET: Optional[str] = None
    MICROSOFT_TENANT_ID: str = "common"
    HOTMAIL_USER: Optional[str] = None
    GOOGLE_PROJECT_ID: Optional[str] = None
    GOOGLE_STUDIO_API_KEY: Optional[str] = None
    SENTRY_DSN: Optional[str] = None
    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding="utf-8", extra="ignore")

    def get_cors_origins(self) -> List[str]:
        if self.CORS_ORIGINS == "*": return ["*", "https://msbross.me"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()] + ["https://msbross.me"]

settings = Settings()
for folder in ["temp_audio", "temp_vision", "scripts"]:
    os.makedirs(folder, exist_ok=True)
