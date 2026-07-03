"""
Geographic and logistic calculation engine.
Determines optimal transport mode and real travel costs.
"""
import os
from dataclasses import dataclass
from math import radians, sin, cos, sqrt, atan2
from typing import Optional

from app.core.constants import (
    MEQUINENZA_COORDS,
    REFERENCE_AIRPORTS,
    CAR_THRESHOLD_KM,
    DEFAULT_FUEL_CONSUMPTION_L100,
    FUEL_PRICE_DEFAULT_EUR,
    TOLL_COST_PER_KM,
)
from app.domain.entities import TravelOption
from app.core.config import settings


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    φ1, φ2 = radians(lat1), radians(lat2)
    Δφ = radians(lat2 - lat1)
    Δλ = radians(lon2 - lon1)
    a = sin(Δφ / 2) ** 2 + cos(φ1) * cos(φ2) * sin(Δλ / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def calculate_road_distance(straight_km: float, terrain: str = "standard") -> float:
    factors = {"standard": 1.25, "mountain": 1.35, "coastal": 1.20}
    return straight_km * factors.get(terrain, 1.25)


def calculate_fuel_cost(
    distance_km: float,
    consumption_l100: float = DEFAULT_FUEL_CONSUMPTION_L100,
    fuel_price_eur: Optional[float] = None,
    passengers: int = 3,
) -> dict:
    price = fuel_price_eur or settings.current_fuel_price_eur
    liters_one_way = (distance_km / 100) * consumption_l100
    liters_round_trip = liters_one_way * 2
    fuel_total = liters_round_trip * price
    toll_total = distance_km * 2 * TOLL_COST_PER_KM
    return {
        "liters_consumed": round(liters_round_trip, 2),
        "fuel_price_eur_liter": round(price, 3),
        "fuel_cost_eur": round(fuel_total, 2),
        "toll_estimate_eur": round(toll_total, 2),
        "total_drive_cost_eur": round(fuel_total + toll_total, 2),
        "cost_per_person_eur": round((fuel_total + toll_total) / passengers, 2),
    }


def resolve_travel_mode(
    dest_lat: float,
    dest_lon: float,
    origin: tuple = MEQUINENZA_COORDS,
    fuel_consumption: float = DEFAULT_FUEL_CONSUMPTION_L100,
    terrain: str = "standard",
) -> TravelOption:
    straight_km = haversine_km(*origin, dest_lat, dest_lon)
    road_km = calculate_road_distance(straight_km, terrain)
    drive_h = road_km / 90.0
    fuel_data = calculate_fuel_cost(road_km, fuel_consumption)

    if road_km <= CAR_THRESHOLD_KM:
        return TravelOption(
            mode="car",
            distance_km=round(road_km, 1),
            drive_hours=round(drive_h, 2),
            fuel_cost_eur=fuel_data["fuel_cost_eur"],
            toll_cost_eur=fuel_data["toll_estimate_eur"],
            total_transport_cost=fuel_data["total_drive_cost_eur"],
        )

    nearest = min(
        REFERENCE_AIRPORTS.items(),
        key=lambda ap: haversine_km(*origin, *ap[1]["coords"]),
    )
    return TravelOption(
        mode="flight",
        distance_km=round(road_km, 1),
        drive_hours=round(drive_h, 2),
        fuel_cost_eur=fuel_data["fuel_cost_eur"],
        toll_cost_eur=fuel_data["toll_estimate_eur"],
        nearest_airport=nearest[0],
        total_transport_cost=fuel_data["total_drive_cost_eur"],
    )
