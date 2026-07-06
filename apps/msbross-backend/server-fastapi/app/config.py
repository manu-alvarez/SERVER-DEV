import json, os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    port: int = 8005

    @property
    def public_dir(self) -> str:
        return os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")

    @property
    def db_path(self) -> str:
        return os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "msbross.db")


settings = Settings()


def load_api_keys() -> dict:
    vault_path = "/api_keys_vault.json"
    if not os.path.exists(vault_path):
        vault_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
            "api_keys_vault.json",
        )
    if not os.path.exists(vault_path):
        return {}

    with open(vault_path, "r", encoding="utf-8") as f:
        vault = json.load(f)

    llms = vault.get("LLM_PROVIDERS", {})
    keys: dict[str, list[str]] = {}

    def extract_keys(source) -> list[str]:
        if isinstance(source, list):
            return [k["key"] for k in source if isinstance(k, dict) and k.get("key")]
        if isinstance(source, dict):
            return [v for v in source.values() if isinstance(v, str) and v]
        return []

    keys["or"] = extract_keys(llms.get("OPENROUTER", []))
    keys["gm"] = extract_keys(llms.get("GOOGLE_GEMINI", []))
    keys["gr"] = extract_keys(llms.get("GROQ", []))
    keys["mi"] = [llms.get("OTHER_LLMS", {}).get("MISTRAL", "")]
    keys["tg"] = [llms.get("OTHER_LLMS", {}).get("TOGETHER", "")]
    keys["hf"] = [vault.get("MULTIMEDIA_AND_VOICE", {}).get("HUGGINGFACE", "")]

    for prefix in keys:
        keys[prefix] = [k for k in keys[prefix] if k]

    return keys
