"""
SQLAlchemy ORM models for Family Travel Finder.
"""
import uuid
from datetime import datetime, date
from decimal import Decimal

from sqlalchemy import (
    Column, String, Float, Integer, Numeric, Date, DateTime,
    ForeignKey, JSON, Text, CheckConstraint, Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=True)
    preferences = Column(JSONB, default=lambda: {
        "adults": 2,
        "children": [{"age": 3}],
        "max_drive_km": 400,
        "fuel_consumption_l100": 6.5,
        "preferred_airports": ["ZAZ", "REU", "BCN"],
    })
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    searches = relationship("Search", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")


class Search(Base):
    __tablename__ = "searches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    travel_mode = Column(String, CheckConstraint("travel_mode IN ('car', 'flight', 'both')"))
    date_from = Column(Date, nullable=False)
    date_to = Column(Date, nullable=False)
    budget_max = Column(Numeric(10, 2), nullable=True)
    query_json = Column(JSONB, nullable=True)
    result_count = Column(Integer, default=0)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="searches")
    destinations = relationship("Destination", back_populates="search", cascade="all, delete-orphan")


class Destination(Base):
    __tablename__ = "destinations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    search_id = Column(UUID(as_uuid=True), ForeignKey("searches.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    country = Column(String, nullable=False)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    distance_km = Column(Numeric(8, 2), nullable=True)
    travel_mode = Column(String, nullable=True)
    drive_hours = Column(Numeric(4, 2), nullable=True)
    fuel_cost_eur = Column(Numeric(8, 2), nullable=True)
    flight_price_eur = Column(Numeric(8, 2), nullable=True)
    hotel_name = Column(String, nullable=True)
    hotel_stars = Column(Integer, nullable=True)
    family_score = Column(Numeric(3, 2), nullable=True)
    amenities = Column(JSONB, nullable=True)
    total_price_eur = Column(Numeric(10, 2), nullable=True)
    offer_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    search = relationship("Search", back_populates="destinations")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    destination_id = Column(UUID(as_uuid=True), ForeignKey("destinations.id", ondelete="CASCADE"))
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="favorites")
