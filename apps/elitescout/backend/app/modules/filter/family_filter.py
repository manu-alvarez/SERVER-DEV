"""
Family-First filter: scoring and validation for child-friendly destinations.
Designed for toddlers (0-4 years): prioritizes cots, playgrounds, quiet areas.
"""
from dataclasses import dataclass, field
from typing import Any, Optional

from app.core.constants import FAMILY_SCORE_WEIGHTS


@dataclass
class FamilyScore:
    score: float
    passed: bool
    breakdown: dict[str, float]
    warnings: list[str] = field(default_factory=list)
    label: str = "poor"


MINIMUM_FAMILY_SCORE = 0.55


def score_hotel(hotel_data: dict[str, Any]) -> FamilyScore:
    amenities = [a.upper() for a in hotel_data.get("amenities", [])]
    guest_score = hotel_data.get("guestScore", 0) / 10.0
    review_tags = [t.lower() for t in hotel_data.get("reviewTags", [])]

    breakdown = {}
    warnings = []

    breakdown["cuna_disponible"] = (
        1.0 if any(k in amenities for k in ["BABY_COT", "CRIB", "CUNA"]) else 0.0
    )
    if breakdown["cuna_disponible"] == 0:
        warnings.append("No se confirma disponibilidad de cuna — verificar")

    breakdown["parque_infantil"] = (
        1.0 if any(k in amenities for k in [
            "KIDS_CLUB", "PLAYGROUND", "CHILDREN_POOL", "KIDS_POOL"
        ]) else 0.0
    )

    breakdown["piscina_familiar"] = (
        1.0 if "SWIMMING_POOL" in amenities else 0.0
    )

    breakdown["bano_ninos"] = (
        1.0 if any(k in amenities for k in ["BATHTUB", "BATH"]) else 0.5
    )

    family_in_reviews = any(
        tag in review_tags for tag in ["family", "familias", "niños", "children"]
    )
    breakdown["valoracion_familias"] = guest_score if family_in_reviews else guest_score * 0.7

    breakdown["restaurante_ninos"] = (
        1.0 if any(k in amenities for k in [
            "RESTAURANT", "KIDS_MEALS", "HIGH_CHAIR"
        ]) else 0.0
    )

    total = sum(
        breakdown[k] * FAMILY_SCORE_WEIGHTS[k]
        for k in FAMILY_SCORE_WEIGHTS
    )

    label = "excellent" if total >= 0.8 else "good" if total >= 0.65 else "fair" if total >= MINIMUM_FAMILY_SCORE else "poor"

    return FamilyScore(
        score=round(total, 3),
        passed=total >= MINIMUM_FAMILY_SCORE,
        breakdown=breakdown,
        warnings=warnings,
        label=label,
    )


async def llm_validate_family_friendliness(
    hotel_description: str,
    gemini_api_key: Optional[str] = None,
) -> dict:
    """Optional LLM-based validation using Gemini."""
    if not gemini_api_key:
        return {"llm_score": None, "llm_notes": "LLM filter not configured"}

    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel("gemini-3.5-flash")

        prompt = f"""
        Evalúa si este hotel es adecuado para una familia con un niño de 3 años.
        Responde SOLO con JSON: {{"score": 0.0-1.0, "safe": bool, "notes": "..."}}

        Hotel description: {hotel_description[:2000]}
        """
        response = await model.generate_content_async(prompt)
        return {"llm_score": response.text, "llm_notes": "Validated via Gemini"}
    except Exception as e:
        return {"llm_score": None, "llm_notes": f"LLM error: {e}"}
