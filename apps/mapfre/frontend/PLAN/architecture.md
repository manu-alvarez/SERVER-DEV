# Architecture Document: INFOCOL Automation

**Architecture v1.0.0 | Status: ACTIVE | 2026-06-04**

---

## 1. System Context (C4 Level 1)

```
┌─────────────┐     HTTPS      ┌──────────────────┐
│  Tradesperson │ ──────────▶ │  InfoCol Portal   │
│  (User)       │ ◀────────── │  (MAPFRE Web App) │
└──────┬───────┘              └──────────────────┘
       │
       │ local execution
       ▼
┌─────────────────────────────────────────────┐
│         INFOCOL Automation Script           │
│  Python + Playwright + Claude API           │
└──────┬──────────────────────────┬───────────┘
       │                          │
       ▼                          ▼
┌──────────────┐       ┌──────────────────┐
│  macOS       │       │  Claude API      │
│  Keychain    │       │  (Anthropic)     │
│  (encrypted) │       │  → sanitized text│
└──────────────┘       └──────────────────┘
```

## 2. Container Architecture (C4 Level 2)

```
┌─────────────────────────────────────────────────┐
│                  infocol/                         │
├─────────────────────────────────────────────────┤
│  main.py          CLI entry point + orchestration│
│  browser.py       Playwright page controller     │
│  analyzer.py      Claude API client              │
│  form_filler.py   Form interaction logic         │
│  tariff.py        Tariff code database + rules   │
│  security.py      Credential encryption          │
│  displacement.py  Travel distance calculator     │
│  models.py        Pydantic data models           │
│  config.py        Settings + YAML config loader  │
└─────────────────────────────────────────────────┘
```

## 3. Data Flow

```
1. START ──▶ Load config → Read encrypted credentials → Decrypt
2. LOGIN ──▶ Launch Chromium → Navigate to InfoCol → Authenticate
3. SCAN ───▶ Navigate to FIN queue → Extract expediente list
4. LOOP ───▶ For each expediente:
   a. Read description + notes from DOM
   b. Sanitize (strip PII) → Send to Claude API
   c. Parse AI response → Map to tariff codes
   d. Calculate displacement if applicable
   e. Fill form fields sequentially
   f. STOP before Aceptar → Wait for human
   g. On manual confirm → Log result → Next expediente
5. END ────▶ Generate session report → Close browser
```

## 4. Security Architecture

```
┌─────────────────────────────────────┐
│        Credential Storage           │
├─────────────────────────────────────┤
│  Level 1: OS Keychain               │
│  │  macOS: security add-generic-pwd │
│  │  Win:   HKCU\Environment (enc)   │
│  │                                  │
│  Level 2: Encrypted YAML fallback   │
│     AES-256-GCM via cryptography     │
│     Key derived from machine ID      │
└─────────────────────────────────────┘

Data Sanitization (before AI API):
  - Strip: [A-Z]\d{8} (policy numbers)
  - Strip: [A-Z]{3}\d{10} (DNI/NIE)
  - Strip: phone numbers, email addresses
  - Strip: street names, exact addresses
  - Keep: work description, material names
  - Keep: damage type, location type (kitchen/bathroom)
```

## 5. Error Handling Strategy

```
Errors ──▶ Categorize:
  ├── Network (API/Portal down)
  │     └── Retry 3x with exponential backoff
  ├── Auth (credentials invalid)
  │     └── Prompt re-login → re-encrypt
  ├── DOM (page structure changed)
  │     └── Screenshot + dump HTML → abort expediente
  └── AI (response malformed)
        └── Retry with clearer prompt → fallback to manual
```

## 6. Component Design

### 6.1 browser.py
```
BrowserContext:
  - browser: Playwright Chromium instance
  - page: Active page
  - authenticated: bool
  
  Methods:
    launch(headless=False)  # Visible for human oversight
    login(url, user, pass)
    navigate_to_fin_queue()
    get_expedientes() → list[Expediente]
    open_expediente(id)
    read_description() → str
    fill_field(selector, value)
    wait_for_human_confirm()  # Blocks until manual click
    screenshot(path)
    close()
```

### 6.2 analyzer.py
```
Analyzer:
  - client: Anthropic Claude API
  
  Methods:
    analyze(description, notes, province) → AnalysisResult
    - Sends sanitized text
    - Returns structured: {codes: [], displacement: bool, materials: bool}
    
  Prompt Template:
    "Eres un experto en tarifas MAPFRE La Rioja 2026...
     Dado el siguiente trabajo: {description}
     Selecciona el/los códigos correctos de: {tariff_list}
     Responde SOLO con JSON."
```

### 6.3 tariff.py
```
TARIFF_DB = {
  "VBDDD1T": {"desc": "Visita sin trabajo", "category": "visit"},
  "YYDDDYT": {"desc": "Exclusión", "category": "drainage"},
  "XADDD1T": {"desc": "Sin cala", "category": "drainage_sub"},
  "XADDD2T": {"desc": "Con cala", "category": "drainage_sub"},
  "JEDDD1T": {"desc": "Sustitución grifería", "category": "fixtures"},
  "ZZZZZZJ": {"desc": "Solo informe/gestión", "category": "management"},
  "ZZZZZZH": {"desc": "Trabajo por horas", "category": "labour"},
  "SMDDDIT": {"desc": "Material fuera tarifa", "category": "materials"},
  "FADDD8T": {"desc": "Desplazamiento >20km", "category": "travel"},
}
```

### 6.4 displacement.py
```
DisplacementCalculator:
  - base_rates: dict[locality → amount]
  - threshold_km: 20
  
  Methods:
    calculate(from_locality, to_locality) → float
    - Returns travel cost or 0 if <20km
```

### 6.5 form_filler.py
```
FormFiller:
  - page: Playwright page
  
  Methods:
    fill_description(text)
    answer_questions(answers: dict)
    apply_tariff_codes(codes: list)
    set_displacement(km, amount)
    set_materials(amount)
    is_accept_button_visible() → bool
```

## 7. Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Language | Python | 3.10+ |
| Automation | Playwright | latest |
| AI API | Claude (Anthropic) | 2026 |
| Encryption | cryptography | 45.x |
| Config | PyYAML | 6.x |
| Models | Pydantic | 2.x |
| CLI | Click | 8.x |
| Terminal UI | Rich | 14.x |
