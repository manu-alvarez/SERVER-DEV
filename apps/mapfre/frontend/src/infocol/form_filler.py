"""
Form filler for InfoCol expediente submission.

Handles the interactive form filling process after AI analysis.
"""

import logging
from typing import Optional

from .browser import InfoColBrowser
from .models import AnalysisResult

logger = logging.getLogger(__name__)


class FormFiller:
    def __init__(self, browser: InfoColBrowser):
        self.browser = browser

    def fill_from_analysis(self, result: AnalysisResult, description: str) -> None:
        logger.info("Filling form with AI-analyzed data...")

        self._fill_description(description)
        self._apply_tariff_codes(result)
        self._set_displacement(result.displacement_km, result.displacement_amount)
        self._set_materials(result.material_cost)
        self._answer_standard_questions()

        logger.info("Form filling complete. Waiting for human confirmation.")

    def _fill_description(self, text: str) -> None:
        self.browser.fill_field("description_field", text)
        logger.debug("Description filled")

    def _apply_tariff_codes(self, result: AnalysisResult) -> None:
        if result.primary_codes:
            primary = result.primary_codes[0]
            self.browser.select_option("tariff_dropdown", primary.code)
            logger.info("Tariff applied: %s - %s", primary.code, primary.description)

        if len(result.primary_codes) > 1:
            secondary = result.primary_codes[1]
            self.browser.select_option("tariff_dropdown", secondary.code)
            logger.info("Secondary tariff: %s - %s", secondary.code, secondary.description)

        if result.requires_hours and result.hours_estimated > 0:
            self.browser.fill_field("description_field",
                                    f" | Horas estimadas: {result.hours_estimated}h")
            logger.info("Hours noted: %d", result.hours_estimated)

    def _set_displacement(self, km: float, amount: float) -> None:
        if km > 0 and amount > 0:
            self.browser.fill_field("displacement_field", f"{amount:.2f}")
            logger.info("Displacement set: %.2f km = %.2f €", km, amount)

    def _set_materials(self, cost: float) -> None:
        if cost > 0:
            self.browser.fill_field("materials_field", f"{cost:.2f}")
            logger.info("Materials cost set: %.2f €", cost)

    def _answer_standard_questions(self) -> None:
        FAUCET_REUSE = "no"
        SCAFFOLDING = "no"
        WEEKEND_SURCHARGE = "no"

        questions = {
            "reutiliza_grupo": FAUCET_REUSE,
            "andamio": SCAFFOLDING,
            "festivo": WEEKEND_SURCHARGE,
        }

        for question, answer in questions.items():
            self.browser.select_option("question_fields", answer)
            logger.debug("Question %s → %s", question, answer)
