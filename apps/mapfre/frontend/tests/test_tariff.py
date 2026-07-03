"""Tests for tariff code database."""

from infocol.tariff import TARIFF_RULES, get_tariff_prompt, find_rule


def test_tariff_has_codes():
    assert len(TARIFF_RULES) >= 9


def test_tariff_prompt_non_empty():
    prompt = get_tariff_prompt()
    assert "VBDDD1T" in prompt
    assert "YYDDDYT" in prompt
    assert "XADDD1T" in prompt
    assert "SMDDDIT" in prompt


def test_find_existing_rule():
    rule = find_rule("VBDDD1T")
    assert rule is not None
    assert rule.category == "visit"


def test_find_nonexistent_rule():
    rule = find_rule("NONEXIST")
    assert rule is None
