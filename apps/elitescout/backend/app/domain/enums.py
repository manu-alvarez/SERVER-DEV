from enum import StrEnum


class TravelMode(StrEnum):
    CAR = "car"
    FLIGHT = "flight"
    BOTH = "both"


class FamilyScore(StrEnum):
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
