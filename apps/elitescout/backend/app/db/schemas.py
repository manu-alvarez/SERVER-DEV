"""
Pydantic schemas for API request/response validation.
"""
from datetime import date, datetime
from typing import Optional, Any
from uuid import UUID

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    email: str
    name: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: Optional[str] = None
    created_at: datetime


class SearchCreate(BaseModel):
    travel_mode: str = "both"
    date_from: date
    date_to: date
    budget_max: Optional[float] = None
    query_json: Optional[dict] = None


class SearchResponse(BaseModel):
    id: UUID
    travel_mode: str
    date_from: date
    date_to: date
    budget_max: Optional[float] = None
    result_count: int
    duration_ms: Optional[int] = None
    created_at: datetime


class DestinationResponse(BaseModel):
    id: UUID
    name: str
    country: str
    distance_km: Optional[float] = None
    travel_mode: Optional[str] = None
    drive_hours: Optional[float] = None
    fuel_cost_eur: Optional[float] = None
    flight_price_eur: Optional[float] = None
    hotel_name: Optional[str] = None
    hotel_stars: Optional[int] = None
    family_score: Optional[float] = None
    amenities: Optional[Any] = None
    total_price_eur: Optional[float] = None
    offer_url: Optional[str] = None
