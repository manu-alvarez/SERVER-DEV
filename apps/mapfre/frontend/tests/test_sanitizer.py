"""Tests for data sanitization."""

from infocol.analyzer import _sanitize_text


def test_sanitize_policy_number():
    text = "Poliza: A12345678 - Revision general"
    result = _sanitize_text(text)
    assert "[POLIZA]" in result
    assert "A12345678" not in result


def test_sanitize_dni():
    text = "Cliente: 12345678Z - Fuga en cocina"
    result = _sanitize_text(text)
    assert "[DNI]" in result


def test_sanitize_email():
    text = "Contacto: cliente@email.com - Revision"
    result = _sanitize_text(text)
    assert "[EMAIL]" in result
    assert "cliente@email.com" not in result


def test_keep_work_description():
    text = "Fuga de agua en tuberia del bano - Reparacion urgente"
    result = _sanitize_text(text)
    assert "Fuga" in result
    assert "tuberia" in result
