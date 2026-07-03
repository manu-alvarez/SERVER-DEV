# PRD: INFOCOL - Automated Claim Form Assistant

**Product Requirements Document**
Version: 1.0.0 | Status: ACTIVE | Last Updated: 2026-06-04

---

## 1. Product Overview

### 1.1 Vision
Eliminate manual data entry errors in MAPFRE InfoCol claim form submission by integrating AI-powered code selection, reducing processing time from ~2 minutes to <30 seconds per expediente while maintaining 100% human supervisory control.

### 1.2 Target Audience
Primary: Pedro González — Professional plumber, Logroño, La Rioja
Secondary: MAPFRE authorized tradespeople (fontaneros, electricians, general repairs) across Spain

### 1.3 Problem Statement
Tradespeople managing MAPFRE insurance claims via the InfoCol portal spend 2+ minutes per expediente navigating dropdown menus, selecting correct tariff codes, and filling repetitive form fields. Incorrect code selection causes billing errors, revenue loss, and claim rejections. The process is repetitive, error-prone, and scales poorly across multiple daily expedientes.

### 1.4 Solution
A local Python + Playwright automation script that:
- Authenticates securely into InfoCol
- Detects pending FIN expedientes
- Analyzes work descriptions via AI (Claude API)
- Selects correct MAPFRE 2026 Rioja tariff codes
- Fills the complete form automatically
- Halts before final submission — **human always confirms**

---

## 2. Functional Requirements

### FR-01: Secure Authentication
- Store credentials in OS-level encrypted storage (Windows HKCU\Environment / macOS Keychain)
- Support MFA/workforce federation if required
- Never persist credentials in plaintext files or logs

### FR-02: Expediente Discovery
- Navigate to the pending services queue
- Identify all expedientes with status "FIN" (pendiente de descontar)
- Extract expediente ID, description, notes, and metadata

### FR-03: AI-Powered Code Selection
- Send anonymized work description to Claude API (no PII, no policy numbers)
- Analyze against MAPFRE La Rioja 2026 tariff table
- Return: primary code, secondary codes, displacement flag, material cost flag

### FR-04: Form Auto-Fill
- Description field: auto-populated
- Q&A section: all questions answered correctly
- Tariff codes: primary + secondary codes applied
- Displacement: calculated by locality
- Subsequent interventions: partially supported (beta)
- Materials outside tariff: with manual amount entry

### FR-05: Human-in-the-Loop Gate
- Script MUST halt before pressing "Aceptar"
- Visual indicator: "⏸ Waiting for manual Aceptar..."
- Professional reviews, confirms, and clicks submit

### FR-06: Logging & Audit
- Local timestamped log per session
- Log contains: expediente IDs processed, codes selected, actions taken
- NO personal data logged

---

## 3. Non-Functional Requirements

### NFR-01: Security
- **100% local execution** — no expediente data leaves the device
- Claude API receives ONLY work description text — no names, DNI, policy numbers
- Credentials encrypted at rest (cryptography library)
- No cloud database, no external storage

### NFR-02: Performance
- Current: ~2 min/expediente → Target: <30s/expediente
- Concurrent processing not required (single-threaded sequential)
- Cold start: <5s (browser launch to login page)

### NFR-03: Reliability
- Graceful degradation if AI API is unreachable
- Retry logic for network failures (3 attempts)
- Screenshot capture on critical failures for debugging

### NFR-04: Compatibility
- Python 3.10+
- Windows 10/11 & macOS 14+
- Chromium via Playwright

---

## 4. Tariff Code Reference (MAPFRE La Rioja 2026)

| Code | Description | Category |
|------|-------------|----------|
| VBDDD1T | Visita sin trabajo | Visit |
| YYDDDYT + XADDD1T | Exclusión sin cala | Drainage |
| YYDDDYT + XADDD2T | Exclusión con cala | Drainage |
| YYDDDYT + JEDDD1T | Sustitución de grifería | Fixtures |
| ZZZZZZJ | Solo informe / gestión | Management |
| ZZZZZZH × horas | Trabajo por horas | Labour |
| SMDDDIT + importe | Material fuera tarifa | Materials |
| FADDD8T + km | Desplazamiento >20km | Travel |

---

## 5. Architecture Decision Records

### ADR-001: Playwright over Selenium
- **Status**: Accepted
- **Context**: Need reliable browser automation with modern JS SPA support
- **Decision**: Playwright — faster, auto-waits, better selectors, cross-browser
- **Consequences**: Requires `playwright install chromium` on first run

### ADR-002: Claude API for AI Analysis
- **Status**: Accepted
- **Context**: Need LLM with strong Spanish comprehension for work descriptions
- **Decision**: Claude API (Anthropic) — best-in-class for structured output + Spanish
- **Consequences**: Requires API key; cost ~$0.003 per analysis

### ADR-003: Local-Only Architecture
- **Status**: Accepted
- **Context**: MAPFRE data sensitivity and RGPD compliance
- **Decision**: All processing local; AI receives only sanitized text
- **Consequences**: No central coordination; each install is standalone

---

## 6. Future Roadmap

### v1.0 (Current: Beta)
- [x] Login & navigation automation
- [x] FIN expediente detection
- [x] AI description analysis
- [x] Form filling (core)
- [x] Correct tariff codes
- [x] Displacement by locality
- [x] Materials outside tariff
- [ ] Subsequent interventions (complete)
- [ ] Full autonomy (no human review)
- [ ] Province adaptation
- [ ] Multi-trade support
- [ ] Reporting & stats
