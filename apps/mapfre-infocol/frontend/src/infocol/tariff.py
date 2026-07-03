"""
MAPFRE La Rioja 2026 Tariff Code Database.

Source: MAPFRE Convenio La Rioja 2026 - Tarifas Fontaneria.
"""

from dataclasses import dataclass

TARIFF_RULES: dict[str, "TariffRule"] = {}


@dataclass
class TariffRule:
    code: str
    description_es: str
    description_en: str
    category: str
    requires_secondary: bool = False
    compatible_secondary: list[str] | None = None
    is_hourly: bool = False
    is_material: bool = False
    is_travel: bool = False
    unit_price: float | None = None


def _register(rule: TariffRule) -> tuple[str, ...]:
    TARIFF_RULES[rule.code] = rule
    codes = [rule.code]
    if rule.compatible_secondary:
        codes.extend(rule.compatible_secondary)
    return tuple(codes)


VISIT_NO_WORK = _register(TariffRule(
    code="VBDDD1T",
    description_es="Visita sin trabajo - No se realiza reparacion",
    description_en="Visit without work - No repair performed",
    category="visit",
    unit_price=25.00,
))

EXCLUSION_SIN_CALA = _register(TariffRule(
    code="YYDDDYT",
    description_es="Exclusion sin cala - Destapes basicos",
    description_en="Drainage without digging - Basic unclogging",
    category="drainage",
    requires_secondary=True,
    compatible_secondary=["XADDD1T"],
))

EXCLUSION_CON_CALA = _register(TariffRule(
    code="YYDDDYT",
    description_es="Exclusion con cala - Destapes con excavacion",
    description_en="Drainage with digging - Excavation unclogging",
    category="drainage",
    requires_secondary=True,
    compatible_secondary=["XADDD2T"],
))

EXCLUSION_SUB_SIN_CALA = _register(TariffRule(
    code="XADDD1T",
    description_es="Suplemento exclusion sin cala",
    description_en="Supplement drainage without digging",
    category="drainage_sub",
    unit_price=15.00,
))

EXCLUSION_SUB_CON_CALA = _register(TariffRule(
    code="XADDD2T",
    description_es="Suplemento exclusion con cala",
    description_en="Supplement drainage with digging",
    category="drainage_sub",
    unit_price=30.00,
))

FAUCET_REPLACEMENT = _register(TariffRule(
    code="JEDDD1T",
    description_es="Sustitucion de griferia - Cambio de grifos y llaves",
    description_en="Fixture replacement - Changing taps and valves",
    category="fixtures",
    unit_price=35.00,
))

FAUCET_REPLACEMENT_COMBO = _register(
    TariffRule(
        code="YYDDDYT",
        description_es="Exclusion + sustitucion griferia",
        description_en="Drainage + fixture replacement combo",
        category="drainage_fixtures",
        requires_secondary=True,
        compatible_secondary=["JEDDD1T"],
    )
)

ONLY_REPORT = _register(TariffRule(
    code="ZZZZZZJ",
    description_es="Solo informe / gestion - Sin intervencion",
    description_en="Report only / management - No intervention",
    category="management",
    unit_price=15.00,
))

HOURLY_WORK = _register(TariffRule(
    code="ZZZZZZH",
    description_es="Trabajo por horas - Mano de obra por hora",
    description_en="Hourly work - Labour per hour",
    category="labour",
    is_hourly=True,
    unit_price=35.00,
))

MATERIALS_OUTSIDE = _register(TariffRule(
    code="SMDDDIT",
    description_es="Material fuera de tarifa - Repuestos no incluidos",
    description_en="Material outside tariff - Parts not included",
    category="materials",
    is_material=True,
))

TRAVEL_OVER_20KM = _register(TariffRule(
    code="FADDD8T",
    description_es="Desplazamiento >20km - Km exceso",
    description_en="Travel >20km - Excess km",
    category="travel",
    is_travel=True,
    unit_price=0.50,
))


def get_tariff_prompt() -> str:
    rules = []
    for code, rule in TARIFF_RULES.items():
        if rule.requires_secondary and rule.compatible_secondary:
            secs = " + ".join(rule.compatible_secondary)
            rules.append(f"- {rule.code} + {secs}: {rule.description_es}")
        elif not rule.is_hourly and not rule.is_material and not rule.is_travel:
            rules.append(f"- {rule.code}: {rule.description_es}")

    for code, rule in TARIFF_RULES.items():
        if rule.is_hourly:
            rules.append(f"- {rule.code}: {rule.description_es} ({rule.unit_price}€/hora)")
        elif rule.is_material:
            rules.append(f"- {rule.code}: {rule.description_es} (+ importe material)")
        elif rule.is_travel:
            rules.append(f"- {rule.code}: {rule.description_es} ({rule.unit_price}€/km)")

    seen = set()
    unique_rules = []
    for r in rules:
        if r not in seen:
            seen.add(r)
            unique_rules.append(r)

    return "\n".join(unique_rules)


def find_rule(code: str) -> TariffRule | None:
    return TARIFF_RULES.get(code)
