"""
Amadeus API integration for hotel and flight search.
Requires AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in .env
"""
import os
from typing import Optional

from app.core.config import settings


class AmadeusClient:
    def __init__(self):
        self._client = None
        self._initialized = False

    def _ensure_client(self):
        if not self._initialized:
            try:
                from amadeus import Client, ResponseError
                self._client = Client(
                    client_id=settings.amadeus_client_id or os.getenv("AMADEUS_CLIENT_ID"),
                    client_secret=settings.amadeus_client_secret or os.getenv("AMADEUS_CLIENT_SECRET"),
                    hostname="test" if settings.amadeus_env == "test" else "production",
                )
                self._initialized = True
            except ImportError:
                raise RuntimeError("amadeus package not installed. Run: pip install amadeus")
            except Exception as e:
                raise RuntimeError(f"Failed to initialize Amadeus client: {e}")

    def search_hotels(
        self,
        city_code: str,
        check_in: str,
        check_out: str,
        adults: int = 2,
        ratings: Optional[list[str]] = None,
    ) -> list[dict]:
        self._ensure_client()
        try:
            response = self._client.shopping.hotel_offers_search.get(
                cityCode=city_code,
                checkInDate=check_in,
                checkOutDate=check_out,
                adults=adults,
                ratings=ratings or ["3", "4", "5"],
            )
            return response.data
        except Exception as e:
            raise RuntimeError(f"Amadeus Hotel API error: {e}")

    def search_flights(
        self,
        origin_iata: str,
        dest_iata: str,
        departure_date: str,
        adults: int = 2,
        children: int = 1,
    ) -> list[dict]:
        self._ensure_client()
        try:
            response = self._client.shopping.flight_offers_search.get(
                originLocationCode=origin_iata,
                destinationLocationCode=dest_iata,
                departureDate=departure_date,
                adults=adults,
                children=children,
                currencyCode="EUR",
                max=20,
            )
            return response.data
        except Exception as e:
            raise RuntimeError(f"Amadeus Flights API error: {e}")
