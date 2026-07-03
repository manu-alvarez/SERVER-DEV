from dataclasses import dataclass, field
from datetime import date
from typing import Optional
from decimal import Decimal


@dataclass
class SearchQuery:
    origin_lat: float
    origin_lon: float
    date_from: date
    date_to: date
    travel_mode: str = "both"
    budget_max: Optional[float] = None
    adults: int = 2
    children_ages: list[int] = field(default_factory=lambda: [3])
    fuel_consumption: float = 6.5


@dataclass
class TravelOption:
    mode: str
    distance_km: float
    drive_hours: Optional[float] = None
    fuel_cost_eur: Optional[float] = None
    toll_cost_eur: Optional[float] = None
    flight_price_eur: Optional[float] = None
    nearest_airport: Optional[str] = None
    total_transport_cost: Optional[float] = None


@dataclass
class HotelInfo:
    name: str
    stars: int
    family_score: float
    amenities: list[str]
    price_per_night: float
    guest_score: Optional[float] = None


@dataclass
class TravelOffer:
    destination_name: str
    country: str
    lat: float
    lon: float
    hotel: HotelInfo
    travel_option: TravelOption
    total_price: float
    offer_url: Optional[str] = None
