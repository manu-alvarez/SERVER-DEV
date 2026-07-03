"""Tests for data models."""

from infocol.models import Expediente, TariffCode, AnalysisResult, SessionReport


def test_expediente_creation():
    exp = Expediente(id="V67391281", description="Fuga bano", notes="Urgente")
    assert exp.id == "V67391281"
    assert exp.status == "FIN"


def test_tariff_code():
    code = TariffCode(code="VBDDD1T", description="Visita sin trabajo", category="visit")
    assert code.code == "VBDDD1T"


def test_analysis_result():
    result = AnalysisResult()
    result.primary_codes.append(TariffCode(code="YYDDDYT", description="Exclusion", category="primary"))
    assert len(result.primary_codes) == 1
    assert result.confidence == 0.0


def test_session_report():
    report = SessionReport()
    report.expedientes_processed = 10
    report.expedientes_success = 9
    report.expedientes_failed = 1
    report.total_time_seconds = 600.0
    assert report.avg_time_per_expediente == 60.0
