"""
AI-powered work description analyzer.

Sends sanitized work descriptions to Claude API for
intelligent tariff code selection.
"""

import json
import re
from typing import Optional

from anthropic import Anthropic

from .tariff import get_tariff_prompt
from .models import AnalysisResult, TariffCode


SYSTEM_PROMPT = """Eres un experto en tarifas de fontaneria del convenio MAPFRE La Rioja 2026.

Tu unica funcion es analizar descripciones de trabajos de fontaneria y seleccionar
los codigos de tarifa correctos segun el convenio.

REGLAS ESTRICTAS:
1. Debes responder SOLO con JSON valido. No incluyas explicaciones ni markdown.
2. Si no tienes suficiente informacion, selecciona el codigo mas conservador.
3. Prioriza la seguridad: si dudas entre dos codigos, elige el que MENOS coste genere.

RESPONDE CON ESTE FORMATO JSON EXACTO:
{
  "primary_codes": [
    {"code": "YYDDDYT", "description": "Nombre del codigo", "quantity": 1}
  ],
  "secondary_codes": [
    {"code": "XADDD2T", "description": "Nombre del codigo", "quantity": 1}
  ],
  "displacement_km": 0,
  "material_cost": 0.0,
  "requires_hours": false,
  "hours_estimated": 0,
  "confidence": 0.95,
  "reasoning": "Breve explicacion en espanol de por que se eligieron estos codigos"
}
"""


def _sanitize_text(text: str) -> str:
    text = re.sub(r"[A-Z]\d{8}", "[POLIZA]", text)
    text = re.sub(r"\b\d{8}[A-Z]\b", "[DNI]", text)
    text = re.sub(r"\b\d{3}\.\d{3}\.\d{3}\b", "[DNI]", text)
    text = re.sub(r"\b\d{9}\b", "[TELEFONO]", text)
    text = re.sub(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", "[EMAIL]", text)
    text = re.sub(r"\bC\/[A-Za-z\s]+\b", "[DIRECCION]", text)
    text = re.sub(r"\bCalle\s+[A-Za-z\s]+\b", "[DIRECCION]", text)
    return text.strip()


class Analyzer:
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20260514"):
        self.client = Anthropic(api_key=api_key)
        self.model = model

    def analyze(self, description: str, notes: Optional[str] = None,
                province: str = "La Rioja") -> AnalysisResult:
        sanitized = _sanitize_text(description)
        if notes:
            sanitized += f"\nNotas adicionales: {_sanitize_text(notes)}"

        tariff_table = get_tariff_prompt()

        user_message = f"""PROVINCIA: {province}
TIPO: FONTANERIA

DESCRIPCION DEL TRABAJO:
{sanitized}

TARIFA DISPONIBLE:
{tariff_table}

Analiza el trabajo y selecciona los codigos mas apropiados segun la tarifa MAPFRE La Rioja 2026."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            temperature=0.1,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        return self._parse_response(response.content[0].text)

    def _parse_response(self, raw: str) -> AnalysisResult:
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.strip("`").strip()
            if raw.startswith("json"):
                raw = raw[4:].strip()
        raw = raw.strip()

        data = json.loads(raw)

        result = AnalysisResult(
            displacement_km=float(data.get("displacement_km", 0)),
            displacement_amount=0.0,
            material_cost=float(data.get("material_cost", 0.0)),
            requires_hours=bool(data.get("requires_hours", False)),
            hours_estimated=int(data.get("hours_estimated", 0)),
            confidence=float(data.get("confidence", 0.0)),
            reasoning=str(data.get("reasoning", "")),
        )

        for pc in data.get("primary_codes", []):
            result.primary_codes.append(TariffCode(
                code=pc["code"],
                description=pc.get("description", ""),
                category="primary",
                quantity=int(pc.get("quantity", 1)),
            ))

        for sc in data.get("secondary_codes", []):
            result.primary_codes.append(TariffCode(
                code=sc["code"],
                description=sc.get("description", ""),
                category="secondary",
                quantity=int(sc.get("quantity", 1)),
            ))

        return result
