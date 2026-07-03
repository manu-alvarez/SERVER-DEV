import os
from pathlib import Path
from typing import Optional

import yaml
from pydantic import BaseModel, Field


DEFAULT_CONFIG_PATH = Path.home() / ".infocol" / "config.yaml"


class AIConfig(BaseModel):
    provider: str = "anthropic"
    model: str = "claude-sonnet-4-20260514"
    api_key: Optional[str] = None
    max_retries: int = 3
    temperature: float = 0.1


class BrowserConfig(BaseModel):
    headless: bool = False
    timeout_ms: int = 30000
    slow_mo_ms: int = 100


class DisplacementConfig(BaseModel):
    threshold_km: float = 20.0
    rate_per_km: float = 0.50
    base_rate: float = 5.0


class LoggingConfig(BaseModel):
    level: str = "INFO"
    log_dir: str = str(Path.home() / ".infocol" / "logs")
    max_log_files: int = 30


class InfoColConfig(BaseModel):
    base_url: str = "https://infocol.mapfre.es"
    login_path: str = "/login"
    fin_queue_path: str = "/servicios-pendientes"
    username: Optional[str] = None


class AppConfig(BaseModel):
    province: str = "La Rioja"
    trade: str = "FONTANERIA"
    require_human_confirm: bool = True
    auto_process_all: bool = True

    ai: AIConfig = Field(default_factory=AIConfig)
    browser: BrowserConfig = Field(default_factory=BrowserConfig)
    displacement: DisplacementConfig = Field(default_factory=DisplacementConfig)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    infocol: InfoColConfig = Field(default_factory=InfoColConfig)


def load_config(config_path: Optional[Path] = None) -> AppConfig:
    path = config_path or DEFAULT_CONFIG_PATH

    if path.exists():
        raw = yaml.safe_load(path.read_text())
        return AppConfig.model_validate(raw or {})

    cfg = AppConfig()
    os.makedirs(path.parent, exist_ok=True)
    path.write_text(yaml.dump(cfg.model_dump(), default_flow_style=False, allow_unicode=True))
    return cfg


def save_config(config: AppConfig, config_path: Optional[Path] = None) -> None:
    path = config_path or DEFAULT_CONFIG_PATH
    os.makedirs(path.parent, exist_ok=True)
    path.write_text(yaml.dump(config.model_dump(), default_flow_style=False, allow_unicode=True))
