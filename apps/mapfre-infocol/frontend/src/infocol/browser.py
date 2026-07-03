"""
Playwright browser controller for InfoCol portal automation.
"""

import logging
import time
from pathlib import Path
from typing import Optional

from playwright.sync_api import Page, BrowserContext, Playwright, sync_playwright

from .models import Expediente

logger = logging.getLogger(__name__)

SELECTORS = {
    "username_input": 'input[name="usuario"], input[name="username"], input[type="email"]',
    "password_input": 'input[name="password"], input[type="password"]',
    "login_button": 'button[type="submit"], input[type="submit"], button:has-text("Acceder")',
    "fin_queue_table": 'table:has-text("FIN"), table:has-text("Pendiente"), .tabla-expedientes',
    "expediente_row": 'tr:has(td:has-text("FIN"))',
    "expediente_link": 'a[href*="expediente"], td:first-child a',
    "description_field": 'textarea[name="descripcion"], .descripcion-trabajo, [data-field="description"]',
    "notes_field": 'textarea[name="notas"], .notas, [data-field="notes"]',
    "accept_button": 'button:has-text("Aceptar"), input[value="Aceptar"], button:has-text("Confirmar")',
    "tariff_dropdown": 'select[name="tarifa"], .tarifa-select, [data-field="tariff"]',
    "displacement_field": 'input[name="desplazamiento"], .desplazamiento-input',
    "materials_field": 'input[name="materiales"], .materiales-input',
    "question_fields": '.pregunta-select, select[name*="pregunta"], [data-field*="question"]',
}


class InfoColBrowser:
    def __init__(self, headless: bool = False, timeout_ms: int = 30000, slow_mo_ms: int = 100):
        self.headless = headless
        self.timeout_ms = timeout_ms
        self.slow_mo_ms = slow_mo_ms
        self._playwright: Optional[Playwright] = None
        self._browser = None
        self._context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None

    def launch(self) -> None:
        self._playwright = sync_playwright().start()
        self._browser = self._playwright.chromium.launch(
            headless=self.headless,
            slow_mo=self.slow_mo_ms,
        )
        self._context = self._browser.new_context(
            viewport={"width": 1280, "height": 900},
            locale="es-ES",
        )
        self.page = self._context.new_page()
        self.page.set_default_timeout(self.timeout_ms)
        logger.info("Browser launched")

    def login(self, url: str, username: str, password: str) -> None:
        if not self.page:
            raise RuntimeError("Browser not launched. Call launch() first.")
        logger.info("Navigating to %s", url)
        self.page.goto(url, wait_until="networkidle")
        self.page.fill(SELECTORS["username_input"], username)
        self.page.fill(SELECTORS["password_input"], password)
        self.page.click(SELECTORS["login_button"])
        self.page.wait_for_load_state("networkidle")
        logger.info("Login submitted")

    def navigate_to_fin_queue(self, fin_queue_path: str) -> None:
        if not self.page:
            raise RuntimeError("Browser not launched.")
        self.page.goto(fin_queue_path, wait_until="networkidle")
        time.sleep(2)
        logger.info("Navigated to FIN queue")

    def get_expedientes(self) -> list[Expediente]:
        if not self.page:
            raise RuntimeError("Browser not launched.")
        expedientes = []
        try:
            rows = self.page.query_selector_all(SELECTORS["expediente_row"])
            if not rows:
                rows = self.page.query_selector_all("table tr")
                rows = [r for r in rows if "FIN" in (r.inner_text() or "")]

            for row in rows:
                text = row.inner_text()
                cells = row.query_selector_all("td")
                if len(cells) >= 2:
                    exp_id = cells[0].inner_text().strip()
                    desc = cells[1].inner_text().strip() if len(cells) > 1 else ""
                    notes = cells[2].inner_text().strip() if len(cells) > 2 else None
                    expedientes.append(Expediente(
                        id=exp_id,
                        description=desc,
                        notes=notes,
                    ))
        except Exception as e:
            logger.warning("Error reading expediente table: %s", e)

        if not expedientes:
            logger.warning("No FIN expedientes found on current page")
        else:
            logger.info("Found %d FIN expedientes", len(expedientes))
        return expedientes

    def open_expediente(self, expediente_id: str) -> None:
        if not self.page:
            raise RuntimeError("Browser not launched.")
        link = self.page.query_selector(f'a:has-text("{expediente_id}")')
        if link:
            link.click()
            self.page.wait_for_load_state("networkidle")
            time.sleep(1)
            logger.info("Opened expediente %s", expediente_id)
        else:
            logger.warning("Could not find link for expediente %s", expediente_id)

    def get_description(self) -> str:
        if not self.page:
            return ""
        try:
            el = self.page.query_selector(SELECTORS["description_field"])
            if el:
                return el.input_value() or el.inner_text()
        except Exception:
            pass
        return ""

    def get_notes(self) -> str:
        if not self.page:
            return ""
        try:
            el = self.page.query_selector(SELECTORS["notes_field"])
            if el:
                return el.input_value() or el.inner_text()
        except Exception:
            pass
        return ""

    def fill_field(self, selector_key: str, value: str) -> None:
        if not self.page:
            raise RuntimeError("Browser not launched.")
        selector = SELECTORS.get(selector_key)
        if not selector:
            logger.warning("Unknown selector key: %s", selector_key)
            return
        try:
            el = self.page.query_selector(selector)
            if el:
                el.fill(value)
                logger.debug("Filled %s with '%s'", selector_key, value[:50])
            else:
                logger.warning("Field not found for selector: %s", selector_key)
        except Exception as e:
            logger.warning("Failed to fill %s: %s", selector_key, e)

    def select_option(self, selector_key: str, value: str) -> None:
        if not self.page:
            raise RuntimeError("Browser not launched.")
        selector = SELECTORS.get(selector_key)
        if not selector:
            return
        try:
            el = self.page.query_selector(selector)
            if el:
                el.select_option(value)
                logger.debug("Selected %s = %s", selector_key, value)
        except Exception as e:
            logger.warning("Failed to select %s: %s", selector_key, e)

    def is_accept_button_visible(self) -> bool:
        if not self.page:
            return False
        try:
            return self.page.query_selector(SELECTORS["accept_button"]) is not None
        except Exception:
            return False

    def wait_for_human_confirm(self) -> None:
        if not self.page:
            return
        logger.info("=" * 60)
        logger.info("⏸ Form filled. Waiting for human to review and press Aceptar...")
        logger.info("=" * 60)
        try:
            self.page.wait_for_function(
                f"() => {{ const btn = document.querySelector('{SELECTORS['accept_button']}'); return !btn || btn.disabled; }}",
                timeout=600000,
            )
        except Exception:
            logger.info("Manual confirmation wait ended (timeout or manual continue)")

    def screenshot(self, path: str) -> None:
        if self.page:
            self.page.screenshot(path=path, full_page=True)

    def close(self) -> None:
        if self._context:
            self._context.close()
        if self._browser:
            self._browser.close()
        if self._playwright:
            self._playwright.stop()
        logger.info("Browser closed")
