from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "Family Travel Finder"
    debug: bool = True

    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/family_travel"

    amadeus_client_id: Optional[str] = None
    amadeus_client_secret: Optional[str] = None
    amadeus_env: str = "test"

    google_maps_api_key: Optional[str] = None

    current_fuel_price_eur: float = 1.72

    gemini_api_key: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
