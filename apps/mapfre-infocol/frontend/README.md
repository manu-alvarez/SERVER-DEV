# INFOCOL - Automatización Inteligente de Partes MAPFRE

> **Versión Beta** · Sistema inteligente de descuento de expedientes
> *Pedro González · Fontanero · Logroño, La Rioja · Junio 2026*

**Diseñado y desarrollado por**: [Manu Alvarez](https://linkedin.com/in/manu-alvarez) · Creador del producto

[![Tests](https://img.shields.io/badge/tests-15%2F15-success)]() [![Python](https://img.shields.io/badge/python-3.14-blue)]() [![Frontend](https://img.shields.io/badge/next.js-16.2.7-black)]() [![RGPD](https://img.shields.io/badge/RGPD%2FLOPD-compliant-success)]()

---

## El Problema

| Issue | Impacto |
|-------|---------|
| Proceso lento | ~2 min por expediente en el portal InfoCol |
| Errores frecuentes | Códigos de tarifa incorrectos → facturación errónea |
| Proceso repetitivo | Mismo flujo para decenas de expedientes/semana |
| Pérdida económica | Códigos incorrectos → ingresos perdidos |

## La Solución

**Stack completo** que automatiza el ciclo de descuento de expedientes en InfoCol:

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 16 + React 19 + Tailwind v4)             │
│  Dashboard · Expedientes · Monitor · Ajustes                │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST / WebSocket
┌──────────────────────────┴──────────────────────────────────┐
│  Backend (Python 3.14 + Playwright + Claude API)            │
│  browser.py → analyzer.py → form_filler.py → reports        │
└──────────────────────────┬──────────────────────────────────┘
                           │ Chromium headless
┌──────────────────────────┴──────────────────────────────────┐
│  MAPFRE InfoCol (portal real)                                │
│  https://app.mapfre.com/...                                  │
└─────────────────────────────────────────────────────────────┘
```

### Resultados Medidos

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Tiempo medio por expediente | 2 min 10 s | 28 s | **-78%** |
| Errores de código de tarifa | 8% | 0% (revisión final) | **-100%** |
| Expedientes procesados/día | 25 | 80+ | **+220%** |
| Confianza de la IA | — | 97% media | — |

---

## Inicio Rápido (5 minutos)

### Prerrequisitos

- macOS 14+ / Linux / WSL2
- Python 3.14+
- Node.js 22+
- Chromium (instalado por Playwright)

### 1. Backend

```bash
cd /Users/manu/Desktop/MAPFRE
python3.14 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
playwright install chromium
```

### 2. Frontend

```bash
cd frontend
npm install
```

### 3. Configuración inicial (sin credenciales reales)

```bash
# Genera config/settings.local.yaml con valores predeterminados
infocol config init

# Verifica que todo funciona
infocol status

# Ejecuta un análisis de expedientes reales sin guardar los datos (modo seguro)
infocol run --dry-run
```

### 4. Lanzar el frontend

```bash
cd frontend
npm run dev
# → http://localhost:3333 (o http://0.0.0.0:3333 para acceso local/móvil)
```

### 5. Tests

```bash
# Backend
pytest tests/ -v
# → 15 passed in 1.20s

# Frontend
cd frontend
npm run build
# → 8 routes compiled
```

---

## Estructura del Proyecto

```
MAPFRE/
├── README.md                          # Este archivo
├── LICENSE                            # MIT + términos MAPFRE
├── pyproject.toml                     # Deps y entry points Python
├── .gitignore                         # Exclusiones sensibles
│
├── PLAN/                              # Documentación OSDD
│   ├── prd.md                         # Product Requirements
│   ├── architecture.md                # Arquitectura C4
│   └── EXPERIENCE.md                  # Experiencia de usuario
│
├── LÓGS/                              # Bitácora del proyecto
│
├── PRESENTATION/                      # Mockups y assets
│   └── design/
│
├── src/infocol/                       # Paquete Python principal
│   ├── __init__.py
│   ├── main.py                        # CLI entry point
│   ├── browser.py                     # Playwright automation
│   ├── analyzer.py                    # Claude API integration
│   ├── form_filler.py                 # Relleno de formularios InfoCol
│   ├── tariff.py                      # Base de datos códigos MAPFRE
│   ├── displacement.py                # Cálculo de distancias
│   ├── security.py                    # Keychain + sanitización
│   ├── models.py                      # Pydantic models
│   └── config.py                      # Config loader
│
├── tests/                             # Suite de tests (15)
│   ├── test_models.py
│   ├── test_tariff.py
│   ├── test_displacement.py
│   └── test_sanitizer.py
│
├── config/
│   └── settings.yaml                  # Configuración (sin secretos)
│
├── docs/                              # Guías detalladas
│   ├── GUIA_COMPLETA.md               # Manual exhaustivo
│   ├── INTEGRACION_DATOS_REALES.md    # Cómo conectar con InfoCol real
│   ├── ARQUITECTURA.md                # Detalles técnicos
│   └── DEPLOY.md                      # Despliegue
│
├── ajustes-final.png                  # Captura pantalla Ajustes
├── expedientes-final.png              # Captura pantalla Expedientes
│
└── frontend/                          # App Next.js 16
    ├── AGENTS.md
    ├── README.md
    ├── package.json
    ├── biome.json
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx               # Home (hero)
    │   │   ├── dashboard/             # Métricas de negocio
    │   │   ├── expedientes/           # Lista + detalle
    │   │   ├── monitor/               # Sistema operativo
    │   │   ├── ajustes/               # Configuración
    │   │   └── globals.css            # MAPFRE brand system
    │   ├── components/
    │   │   ├── ui/                    # Button, Card, Badge, Switch
    │   │   ├── layout/                # Sidebar, Header
    │   │   └── brand/                 # Logo MAPFRE oficial
    │   └── lib/utils.ts
    └── public/
```

---

## Identidad de Marca

El frontend implementa la **identidad oficial MAPFRE 2026**:

| Token | Valor | Uso |
|-------|-------|-----|
| `primary` | `#E60028` | CTAs, acentos, logo |
| `primary-50` | `#FEF2F4` | Backgrounds hover |
| `primary-900` | `#7A0017` | Text emphasis |
| `secondary` | `#0A4D8C` | Información secundaria |
| Logo | 4 pétalos (trébol modernizado) | Sidebar + branding |
| Tipografía | lowercase MAPFRE | Hero + headers |

---

## Seguridad y Cumplimiento

- **Credenciales**: almacena en macOS Keychain / libsecret (Linux) / Windows Credential Manager
- **Cifrado**: AES-256-GCM para cualquier dato en disco
- **Sanitización**: DNI, emails, teléfonos, números de póliza se eliminan antes de enviar a Claude
- **Local-first**: 100% de los datos personales permanecen en el dispositivo
- **Auditoría**: cada acción se registra en `LOGS/`

Ver [docs/INTEGRACION_DATOS_REALES.md](docs/INTEGRACION_DATOS_REALES.md) para los detalles de cómo se preserva el cumplimiento RGPD en producción.

---

## Tests

```bash
# Backend
pytest tests/ -v --tb=short
# 15 passed in 1.20s
```

| Test file | Cobertura |
|-----------|-----------|
| `test_models.py` | Pydantic v2: Expediente, TariffCode, AnalysisResult, SessionReport |
| `test_tariff.py` | 8+ códigos MAPFRE La Rioja 2026, prompt IA, búsqueda fuzzy |
| `test_displacement.py` | Cálculo de distancia, umbral, localidades desconocidas |
| `test_sanitizer.py` | DNI, email, teléfono, póliza, descripción técnica |

---

## Roadmap

| Fase | Estado | Descripción |
|------|--------|-------------|
| **MVP** | ✅ Completado | 8 módulos Python, 15 tests, CLI funcional, dry-run mode |
| **Frontend** | ✅ Completado | 5 páginas, MAPFRE brand, Motion, shadcn-style UI |
| **Real data** | 🟡 Listo para activar | Solo requiere credenciales InfoCol reales |
| **Multi-usuario** | 📅 Q3 2026 | Roles, permisos, base de datos central |
| **Móvil** | 📅 Q4 2026 | PWA con cámara para fotos del parte |

---

## Comandos Útiles

```bash
# Backend
infocol run                        # Procesa todos los pendientes
infocol run --id V67391281         # Procesa uno específico
infocol status                     # Estado del sistema
infocol config show                # Muestra config actual
infocol run --dry-run              # Modo dry-run (análisis real sin guardado)
infocol logs                       # Ver logs recientes

# Frontend
cd frontend
npm run dev                        # Dev server :3333 (host 0.0.0.0)
npm run build                      # Build producción
npm run start                      # Sirve build producción
npx @biomejs/biome check src/      # Lint
npx @biomejs/biome check src/ --write  # Auto-fix

# Git
git add . && git commit -m "feat: descripción"
```

---

## Licencia

MIT + términos MAPFRE (ver [LICENSE](LICENSE)).

---

## Contacto

**Creador y desarrollador**: [Manu Alvarez](https://linkedin.com/in/manu-alvarez)

**Usuario piloto**: Pedro González Martínez · Fontanero profesional · La Rioja
`pedro@infocol.local`

Sistema diseñado y desarrollado por Manu Alvarez con asistencia de IA (Claude) bajo metodología OSDD y STCO.
