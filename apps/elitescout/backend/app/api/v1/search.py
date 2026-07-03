"""
Unified search endpoint.
Orchestrates: geo → travel API → filter → response.
"""
from datetime import date
from typing import Optional, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.modules.geo.calculator import resolve_travel_mode
from app.modules.filter.family_filter import score_hotel

router = APIRouter(prefix="/search", tags=["search"])


class SearchRequest(BaseModel):
    date_from: date
    date_to: date
    travel_mode: Literal["car", "flight", "both"] = "both"
    budget_max: Optional[float] = Field(None, gt=0)
    adults: int = Field(2, ge=1, le=8)
    children_ages: list[int] = Field(default=[3])
    fuel_consumption: float = Field(6.5, ge=0, le=30, description="L/100km")
    dest_lat: float
    dest_lon: float
    dest_name: str
    terrain: str = "standard"


class TravelModeResult(BaseModel):
    recommended_mode: str
    distance_km: float
    drive_hours: Optional[float] = None
    fuel_cost_eur: Optional[float] = None
    toll_cost_eur: Optional[float] = None
    total_transport_cost: Optional[float] = None
    nearest_airport: Optional[str] = None


class SearchResponse(BaseModel):
    destination: str
    travel_analysis: TravelModeResult
    nights: int
    estimated_hotel_total: float = 0
    estimated_total_trip: float = 0


@router.post("/analyze-destination", response_model=SearchResponse)
async def analyze_destination(req: SearchRequest):
    """
    Analyze a single destination:
    1. Calculate travel mode (car vs flight)
    2. Estimate costs
    3. Return comparison data
    """
    travel = resolve_travel_mode(
        dest_lat=req.dest_lat,
        dest_lon=req.dest_lon,
        fuel_consumption=req.fuel_consumption,
        terrain=req.terrain,
    )

    nights = (req.date_to - req.date_from).days
    if nights <= 0:
        raise HTTPException(400, "date_to must be after date_from")

    return SearchResponse(
        destination=req.dest_name,
        travel_analysis=TravelModeResult(
            recommended_mode=travel.mode,
            distance_km=travel.distance_km,
            drive_hours=travel.drive_hours,
            fuel_cost_eur=travel.fuel_cost_eur,
            toll_cost_eur=travel.toll_cost_eur,
            total_transport_cost=travel.total_transport_cost,
            nearest_airport=travel.nearest_airport,
        ),
        nights=nights,
        estimated_hotel_total=0,
        estimated_total_trip=0,
    )


@router.post("/analyze-hotels")
async def analyze_hotels(hotel_data: list[dict]):
    """
    Score multiple hotels for family-friendliness.
    Each hotel dict must have: amenities, guestScore, reviewTags
    """
    results = []
    for hotel in hotel_data:
        fs = score_hotel(hotel)
        results.append({
            "name": hotel.get("name", "Unknown"),
            "family_score": fs.score,
            "passed": fs.passed,
            "label": fs.label,
            "breakdown": fs.breakdown,
            "warnings": fs.warnings,
        })
    return {"results": results}
