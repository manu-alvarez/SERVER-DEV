# UIEP — Plataforma Universal de Ingeniería de IA

> **⚠️ PRODUCTION FREEZE — uiep-1.8.0 (2026-11-01)**
> El proyecto queda **CERRADO Y CONGELADO**: estable, respaldado y en producción.
> Commit del release: `d3baf08` · tag `uiep-1.8.0` · backend `sha256:6814a6266f70…`
> Cualquier modificación futura requiere una decisión expresa y un nuevo alcance.
> (Este documento describe la plataforma tal cual está desplegada.)

> **Guía de inicio y arquitectura** — todo lo necesario para entender y usar
> UIEP sin depender del historial de desarrollo. Versión de este documento:
> `uiep-1.8.0` (release congelado).

## Qué es UIEP

UIEP (*Universal Intelligence Engineering Platform*) es una plataforma
autoalojada que convierte **ideas en artefactos de ingeniería validados,
versionados, ejecutables y auditables**:

- **Genera** agentes, workflows, APIs, aplicaciones, sistemas agénticos,
  prompts, conocimiento, datasets, harnesses, frameworks y SaaS compuestos —
  desde contratos declarativos validados (nunca código arbitrario).
- **Registra** todo en un Universal Registry con versionado semver,
  procedencia por hashes, ciclo de vida auditado (8 estados) y grafos de
  dependencias con detección de ciclos.
- **Compone** proyectos UES completos reutilizando artefactos existentes o
  generándolos en orden topológico con rollback lógico.
- **Ejecuta** en un sandbox aislado (contenedor sin red, sin disco, sin
  privilegios) los artefactos ejecutables, con límites duros y cancelación.
- **Evalúa** la calidad en 4 dimensiones (schema, referencias, seguridad,
  comportamiento) con métricas deterministas.
- **Exporta** bundles estructurados reinstalables (`uiep-export-v1`).

## Arquitectura (componentes reales)

```
navegador (Control Center, React/MUI, bundle estático)
   │  cookie de sesión + CSRF
   ▼
BFF de consola (uiep-backend:4000) ─── rutas /api/console/…
   │  · auth de consola (HMAC + cookie firmada)
   │  · rate limits (login 5/15min, generación 30/min, ejecución 12/min)
   │
   ├── Generator Engine (16 generadores deterministas)
   │     · agentes/workflows → data/specs (EJECUTABLES por los runtimes)
   │     · 12 kinds de documento → data/engineering/artifacts/{Kind}/
   ├── Universal Registry (UES uiep.io/ues/v1 + ciclo de vida + grafos)
   ├── Compositor de proyectos (specRef reutiliza / generate delega / $ref)
   ├── Export (bundles uiep-export-v1 reinstalables)
   ├── Quality Engine (schema/refs/security/behavior)
   ├── Execution Registry (runs con métricas, logs redactados, reconciliación)
   ├── Runtimes existentes (agent-runtime, workflow-engine, knowledge+RAG,
   │     tool-registry deny-by-default, model-gateway → Ollama)
   └── Runner (token dedicado) ◀── callbacks del sandbox
   ▲
uiep-sandbox:4100 — contenedor AISLADO: rootfs read-only, tmpfs noexec 64MB,
cap_drop ALL, no-new-privileges, pids 64, mem 256MB, red docker internal:true
(SIN salida a internet), sin volúmenes ni socket Docker. Interpreta los
artefactos declarativos y orquesta las ejecuciones agénticas vía runner.
```

## Capacidades reales del catálogo (resumen honesto)

| Tipo | Generable | Ejecutable hoy | Nota |
|---|---|---|---|
| agent / workflow | ✔ | ✔ (runtimes M2–M8) | specs ejecutables en data/specs |
| tool-collection / knowledge-base | ✔ | ✔ | ingesta y bindings reales |
| multi-agent-system | ✔ | ✔ (workflow real) | subgenera miembros |
| prompt-system / skill-pack / framework / evaluation / harness / mcp-server / rag-system | ✔ | ✖ (→ M14+ sandbox) | documentos validados; el gate RAG 0.70 lo posee el runtime |
| api-platform | ✔ | parcial (API Runtime vía BFF+sandbox) | el SERVIDOR público requiere ruta Traefik dedicada |
| application / agentic-app / saas | ✔ | parcial (Agentic App Runtime) | app como unidad → fases posteriores |
| enterprise-architecture / infrastructure-stack / deployment-architecture | ✖ | ✖ | solo schema (honestidad) |

## Inicio rápido

1. **Sesión**: abre el Control Center (`https://uiep.manuelalvarez.dev/app/uiep/`)
   e inicia con la contraseña de consola del despliegue.
2. **Explora el catálogo**: `Ingeniería · Catálogo` — cada tipo declara qué
   puede hacer REALMENTE.
3. **Genera**: `Ingeniería · Generar` → elige tipo → carga el preset real →
   Validar (dry-run) → Generar. Re-ejecutar es seguro (idempotente por hash).
4. **Compón**: `Ingeniería · Compositor` → artefactos con specRef/generate →
   Componer → grafo del proyecto.
5. **Ejecuta**: `Ingeniería · Ejecuciones` → Agentic App/API/dataset en el
   sandbox (o el terminal: `bash apps/uiep/backend/examples/m16/proyecto-referencia.sh`).
6. **Evalúa y exporta**: `Ingeniería · Calidad` y `Ingeniería · Export`.

Contratos de API completos: `docs/UIEP-M12-CONTRATOS.md`,
`docs/UIEP-M13-CONTRATOS.md`, `docs/UIEP-M14-CONTRATOS.md`.

## Instalación / despliegue

- Monorepo pnpm (`apps/uiep`): backend (Express+TS), web (React+Vite),
  paquete `@uiep/agent-spec` (schemas zod compartidos), sandbox (node puro).
- Build backend: `corepack pnpm@9.15.0 --filter "uiep-backend..." build`
  (Docker lo hace dentro: `docker compose build uiep-backend uiep-sandbox`).
- Build web: `corepack pnpm@9.15.0 --filter "@uiep/web" build` → el bundle
  queda en `www/app/uiep/` (COMMITEADO; el build borra BUILD-INFO.json →
  restaurar con `git checkout`).
- Despliegue VPS (proyecto compose `infrastructure`):
  `git fetch && git reset --hard origin/main` → `docker compose --env-file .env -p infrastructure -f infrastructure/docker-compose.yml build uiep-backend uiep-sandbox` → `up -d --force-recreate`. **OJO**: con `-f`, el `.env`
  se busca en `infrastructure/` — usar `--env-file .env`.
- Env del backend: `UIEP_CONSOLE_PASSWORD`, `UIEP_RUNNER_TOKEN`,
  `SANDBOX_EXEC_TOKEN`, `SANDBOX_URL`, `OLLAMA_BASE_URL`, `UIEP_HOOKS`,
  `UIEP_RUNTIME_TOKEN` (todos por referencia, jamás en el repo).

## Backups, restauración y rollback

- **Backup** (siempre ANTES de desplegar): `bash infrastructure/backup/pull-uiep-backup.sh`
  → tgz con data/specs + data/engineering + knowledge + runtime (VPS + iCloud).
- **Restauración probada**: extraer el tgz y arrancar un backend efímero con
  los datos (`docker run --rm -v /tmp/restore/data:/app/data:ro -p 127.0.0.1:4999:4000`)
  → health + catálogo + conteos verificados (M16) — sin tocar producción.
- **Rollback de código**: anclas de imagen etiquetadas (1.0.0→1.6.0) →
  `docker tag msbrossai-uiep-backend:<anterior> msbrossai-uiep-backend:latest`
  + `up -d --force-recreate` (los datos viven en el volumen `uiep-backend-data`,
  intactos). NUNCA `docker image prune -a` (incidente 1.2.0).

## Limitaciones conocidas y roadmap

1. Runs zombis del Execution Registry: reconciliación automática activa, pero
   sin reconciliar states intermedios de procesos killed a mitad de write.
2. Sin exposición pública de endpoints generados (requiere ruta Traefik
   dedicada + autorización propia) — decisión de seguridad vigente.
3. Sandbox por-job en procesos separados — si M17+ introduce contenido
   ejecutable real, se requerirá aislamiento adicional.
4. Multi-tenancy REAL (persistencia por tenant) — hoy declarativa (SaaS).
5. Contención de Ollama con otras apps del host (turnos 18–120s).
6. ZIP binario de export (hoy JSON estructurado equivalente).
7. Editor visual de composición con drag&drop de dependencias.

## Suite de pruebas

- Backend: `corepack pnpm --filter uiep-backend test` → 240 tests (240/240).
- Frontend: `corepack pnpm --filter "@uiep/web" test` → 13 tests vitest.
- E2E plataforma: `dist/tests/e2e-platform.test.js` (ciclo completo).
- Proyecto de referencia reproducible: `apps/uiep/backend/examples/m16/proyecto-referencia.sh`.

## Estado definitivo del release (PRODUCTION FREEZE)

| Elemento | Valor |
|---|---|
| Versión final | **1.8.0** |
| Tag / commit | `uiep-1.8.0` → `d3baf08` (local y GitHub verificados) |
| Backend | `msbrossai-uiep-backend:1.8.0` = `sha256:6814a6266f70…` |
| Sandbox | `msbrossai-uiep-sandbox:1.8.0` = `sha256:d2f9cd47c6cf…` |
| Frontend | bundle `index-CjCgK9vr.js` (BUILD-INFO sourceCommit `22c5d2d`) |
| Backup final | `uiep-data-2026-11-01-1811.tgz` — 124,647 bytes — sha256 `363e9652d0af26db…` — VPS `/home/ubuntu/backups/uiep/` + iCloud `backups-local/uiep/` (mismo hash verificado en ambas) |
| Restauración | extraer tgz + `docker run --rm -v <datos>:/app/data:ro -p 127.0.0.1:4999:4000` (probada en M16/M17) |
| Rollback | retag de ancla (1.0.0→1.7.0 conservadas) + `up -d --force-recreate` con `-p infrastructure` y `--env-file .env` |
| Verificación de cierre | 240 backend + 13 frontend verdes · 11 APIs 200 · auth 401 sin sesión · aislamiento sandbox inspeccionado · contenedores ajenos intactos |

