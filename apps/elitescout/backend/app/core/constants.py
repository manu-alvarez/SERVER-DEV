"""
Domain constants for the Family Travel Finder system.
Mequinenza (Zaragoza, Spain) as the absolute origin.
"""
from dataclasses import dataclass
from typing import Final

MEQUINENZA_COORDS: Final = (41.3667, 0.3333)
MEQUINENZA_NAME: Final = "Mequinenza, Zaragoza, España"

REFERENCE_AIRPORTS: Final = {
    "ZAZ": {"name": "Zaragoza", "coords": (41.6663, -1.0415), "drive_km": 95},
    "REU": {"name": "Reus", "coords": (41.1474, 1.1672), "drive_km": 130},
    "BCN": {"name": "Barcelona-El Prat", "coords": (41.2971, 2.0785), "drive_km": 175},
}

CAR_THRESHOLD_KM: Final = 400
CAR_THRESHOLD_H: Final = 4.5

DEFAULT_FUEL_CONSUMPTION_L100: Final = 6.5
FUEL_PRICE_DEFAULT_EUR: Final = 1.72
TOLL_COST_PER_KM: Final = 0.07

FAMILY_SCORE_WEIGHTS: Final = {
    "cuna_disponible": 0.20,
    "parque_infantil": 0.20,
    "piscina_familiar": 0.15,
    "bano_ninos": 0.10,
    "valoracion_familias": 0.25,
    "restaurante_ninos": 0.10,
}
