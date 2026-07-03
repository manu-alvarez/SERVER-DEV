"""Tests for displacement calculator."""

from infocol.displacement import DisplacementCalculator


def test_no_displacement_within_threshold():
    calc = DisplacementCalculator(threshold_km=20, rate_per_km=0.50)
    km, amount = calc.calculate("Logrono")
    assert km == 0.0
    assert amount == 0.0


def test_displacement_above_threshold():
    calc = DisplacementCalculator(threshold_km=20, rate_per_km=0.50)
    km, amount = calc.calculate("Calahorra")
    assert km > 0
    assert amount > 0
    assert km == 28.0
    assert amount == 14.0


def test_unknown_locality():
    calc = DisplacementCalculator()
    km, amount = calc.calculate("Unknown Town")
    assert km == 0.0
    assert amount == 0.0
