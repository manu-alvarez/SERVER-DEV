from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class Expediente:
    id: str
    description: str
    notes: Optional[str] = None
    status: str = "FIN"
    locality: Optional[str] = None
    activity: str = "FONTANERIA"


@dataclass
class TariffCode:
    code: str
    description: str
    category: str
    quantity: int = 1
    unit_price: Optional[float] = None


@dataclass
class AnalysisResult:
    primary_codes: list[TariffCode] = field(default_factory=list)
    displacement_km: float = 0.0
    displacement_amount: float = 0.0
    material_cost: float = 0.0
    requires_hours: bool = False
    hours_estimated: int = 0
    confidence: float = 0.0
    reasoning: str = ""


@dataclass
class SessionReport:
    expedientes_processed: int = 0
    expedientes_success: int = 0
    expedientes_failed: int = 0
    total_time_seconds: float = 0.0
    start_time: datetime = field(default_factory=datetime.now)
    end_time: Optional[datetime] = None
    errors: list[str] = field(default_factory=list)

    @property
    def avg_time_per_expediente(self) -> float:
        if self.expedientes_processed == 0:
            return 0.0
        return self.total_time_seconds / self.expedientes_processed
