"""
Displacement calculator for MAPFRE travel allowance.

Determines if travel exceeds 20km threshold and calculates
the applicable travel supplement (FADDD8T).
"""

from dataclasses import dataclass


@dataclass
class LocalityRate:
    name: str
    province: str
    base_km: float = 0.0


LOCALITY_DISTANCES: dict[str, float] = {
    "Logrono": 0.0,
    "Lardero": 4.5,
    "Villamediana": 6.0,
    "Alberite": 8.5,
    "Navarrete": 12.0,
    "Fuenmayor": 14.0,
    "Cenicero": 18.0,
    "Nalda": 16.5,
    "Entrena": 13.0,
    "Murillo": 11.0,
    "Rincón de Soto": 35.0,
    "Alfaro": 45.0,
    "Calahorra": 48.0,
    "Arnedo": 52.0,
    "Haro": 42.0,
    "Santo Domingo": 45.0,
    "Ezcaray": 68.0,
}


class DisplacementCalculator:
    def __init__(self, threshold_km: float = 20.0, rate_per_km: float = 0.50):
        self.threshold_km = threshold_km
        self.rate_per_km = rate_per_km

    def calculate(self, locality: str) -> tuple[float, float]:
        distance = self._get_distance(locality)
        if distance <= self.threshold_km:
            return (0.0, 0.0)
        excess_km = distance - self.threshold_km
        amount = excess_km * self.rate_per_km
        return (excess_km, round(amount, 2))

    def _get_distance(self, locality: str) -> float:
        for name, dist in LOCALITY_DISTANCES.items():
            if name.lower() in locality.lower():
                return dist
        return 0.0
