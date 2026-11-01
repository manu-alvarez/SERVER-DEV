# UIEP — Unified Intelligence Engine Platform

Plataforma auto-alojada de ingeniería de agentes: contratos declarativos, runtime de
ejecución real, conocimiento documental (RAG), memoria con políticas, orquestación
multiagente, integraciones externas y gobierno operativo — **100% self-hosted** (VPS
Contabo + Ollama, sin servicios de pago).

**Versión actual: 1.0.0** (congelada — ver Freeze al final).

## Arquitectura (4 planos + servicios transversales)

```
CONTROL      Control Center (UI) · AgentSpec · WorkflowSpec · Governance
EJECUCIÓN    Agent Runtime · Workflow Engine · Tools (adaptadores cerrados)
MODELO       Model Gateway · Ollama (qwen3.5:4b) · Embeddings (nomic-embed-text)
DATOS        Knowledge · Memory · Sessions · Runs · Integrations
TRANSVERSAL  Observability · Reliability (idempotencia+backpressure) · Security · Evaluation
```

Principios: contratos declarativos versionados (`uiep.io/v1`), seguridad por defecto
(503 sin credenciales), denegación por defecto en permisos, resultados nunca simulados,
persistencia atómica JSON (SQLite diferido), secretos solo por referencia, motor propio
agnóstico (sin LangGraph/CrewAI/n8n), MCP como interoperabilidad (no núcleo).

## Instalación (VPS)

```bash
git clone https://github.com/manu-alvarez/SERVER-DEV.git && cd SERVER-DEV
# .env en infrastructure/ (claves: UIEP_RUNTIME_TOKEN, UIEP_CONSOLE_PASSWORD, OLLAMA_BASE_URL…)
cd apps/uiep && corepack pnpm@9.15.0 install --frozen-lockfile
corepack pnpm@9.15.0 --filter "uiep-backend..." build
cd ../../infrastructure && docker compose build uiep-backend && docker compose up -d uiep-backend
# el estático se sirve desde www/app/uiep (en el repo) por msbross-proxy
```

Requisitos: node 22 + pnpm 9.15.0 (corepack) + docker + Ollama accesible
(`qwen3.5:4b` + `nomic-embed-text` recomendados).

## Operación

| Tarea | Cómo |
|---|---|
| Consola | `https://uiep.manuelalvarez.dev` (contraseña en `infrastructure/.env`) |
| Rotar contraseña | Ver `PHASE42-HARDENING.md` (2 líneas; invalida sesiones al instante) |
| Backup | Automático diario 04:17 (`infrastructure/backup/uiep-backup.sh`, retención 14 d) |
| Restaurar | Procedimiento en `PHASE42-HARDENING.md` (contenedor aislado, verificado) |
| Evaluación RAG | `corepack pnpm --filter uiep-backend eval:rag` (gate) · `eval:rag:real` (proveedor real) |
| Tests | `corepack pnpm --filter uiep-backend test` (219/219 — incluye el GATE de calidad, 29 de M12 y 8 de M13) |
| Desplegar | push a main → en VPS: `git fetch && git reset --hard origin/main` → install → build → compose build+up → **verificar binario servido** (`docker exec … grep`) |
| Rollback | anclas de imagen (`rollback-*`) o rebuild desde el commit de la fase (matriz abajo) |

## Matriz de trazabilidad / rollback (v1.0 → v1.4)

| Versión | Estado | Commit | Frontend (www/app/uiep) | Backend (imagen) |
|---|---|---|---|---|
| **1.4.0** | **publicada** (`uiep-1.4.0`) | `cfb9028` (Misión 13: api-platform/application/agentic-app/saas + framework módulos; engine 1.1.0) | bundle `index-CEji4u03.js` (sin cambios en 1.3/1.4) | **`msbrossai-uiep-backend:latest`** = `sha256:e6dbc822c3108c5a…` |
| 1.3.0 | histórica (`uiep-1.3.0`) | `420bea4` (Misión 12: Generator Engine + composición + export) | bundle `index-CEji4u03.js` (sin cambios en 1.3) | **ancla `1.3.0`** = `a24d6a448492…` |
| 1.2.0 | histórica (`uiep-1.2.0`) | `f70497b` (Misión 11: UES + Registry + Blueprint v1) | bundle `index-CEji4u03.js` (sin cambios en 1.2) | **ancla `1.2.0`** = `49228b89eada` |
| 1.1.0 | histórica (`uiep-1.1.0` = `b4f12a1`) | merge `33287f1` + fix `e773d08` | bundle `index-CEji4u03.js` + `BUILD-INFO.json` | imagen de 1.0.1 (`0286002…`) — **perdida por GC del host**; ancla reconstruida (ver abajo) |
| 1.0.1 | **histórica congelada** (`uiep-1.0.1` = `44431f5`) | RAG 0.70 | bundle `index-DbWra3SD.js` (sustituido) | **ancla reconstruida `1.0.1`** = `128cfd74a443` (fuente-equivalente a la perdida `0286002…`) |
| 1.0.0 | **histórica congelada** (`uiep-1.0.0` = `e1d2d39`) | cierre 1.0 | — | **`msbrossai-uiep-backend:1.0.0`** = `4ea095d6f29a` (original, intacta) |
| Ancla previa | — | — | — | `rollback-fase3` = `3b601c4c898e` (desde commit `8dce03b`) |

**Rollback 1.4.0 → 1.3.0**:
1. La 1.4.0 cambió SOLO el backend (el frontend/bundle es el mismo de 1.1.0): `docker tag msbrossai-uiep-backend:1.3.0 msbrossai-uiep-backend:latest && docker compose -p infrastructure -f infrastructure/docker-compose.yml up -d --force-recreate uiep-backend` (segundos, datos intactos en el volumen).
2. Si hiciera falta reconstruir desde commit: `git worktree add /tmp/ancla <commit>` → `docker build -t msbrossai-uiep-backend:<tag> -f apps/uiep/backend/Dockerfile apps/uiep` → tag+up — NUNCA `compose build` sobre un checkout viejo (retag de `:latest`, incidente Fase 8/9) y NUNCA `docker image prune -a`.
3. Los datos viven en el volumen `uiep-backend-data` — intactos en cualquier rollback de código.
4. **Lección 1.2.0**: la imagen `0286002…` (1.0.1) desapareció del VPS sin prune manual (GC de BuildKit/cron del host sospechoso) — por eso existen ahora 6 anclas etiquetadas (1.0.0, 1.0.1, 1.2.0, 1.3.0, 1.4.0 y rollback-fase3) y el paso 2 está probado. **Nota 1.3.0**: el contenedor `uiep-backend` pertenece al proyecto compose `infrastructure` (label) — recrear con `-p infrastructure` o `--force-recreate` da conflicto de nombre si se omite.

**Semántica de versionado (inequívoca)**: `BUILD-INFO.json → sourceCommit` identifica SIEMPRE el commit que **produjo el artefacto servido** (el bundle si cambió el frontend — en 1.1.0: `e773d08` — o la imagen backend si solo cambió el backend — en 1.2.0 `f70497b` y en 1.3.0 `420bea4`); el **tag de release** (`uiep-1.1.0` = `b4f12a1`, `uiep-1.3.0` = el commit de docs) identifica el **estado final de `main` publicado**, incluida la documentación. Cuando el artefacto y la publicación coinciden en el mismo commit, ambos apuntan igual. (Definido en la Misión 10; campo `releaseTag` previsto para el Registry de M11+.)

| Elemento | Valor |
|---|---|
| Commit congelado | `e1d2d39` (+docs `cf566a0`..) → **git tag `uiep-1.0.0`** |
| Imagen congelada | **`msbrossai-uiep-backend:1.0.0`** = `4ea095d6f29a` (= `:latest` de ese commit) |
| Ancla previa | `rollback-fase3` = `3b601c4c898e` (reconstruida desde commit `8dce03b` — equivalente funcional de la imagen original `ddf5884d`) |
| Config | `infrastructure/docker-compose.yml` (envs: RUNTIME_TOKEN, CONSOLE_PASSWORD, HOOKS, HOOK_TOKEN_1, MCP_EXPOSED_TOOLS, OLLAMA_BASE_URL) |
| Datos | volúmenes docker (`uiep-backend-data`) + backup diario; restauración verificada (18 agentes · 4 tools · 26 sesiones · 30 runs) |
| Procedimiento | `git checkout <tag>` → build → compose up (probado en la reconstrucción del ancla) |

**Lección de procedimiento (Fase 8/9)**: nunca hacer `build` sobre un checkout de otra
versión para "reconstruir un ancla" sin retag posterior de `:latest` (el incidente se
detectó por la verificación del binario servido); usar `docker build -t ancla .` directo,
o retag `:latest` tras volver a main. `docker image prune -a` PROHIBIDO mientras existan
anclas (elimina imágenes tagged sin contenedor).

## Historial de fases (documentos)

| Fase | Doc |
|---|---|
| 0-1: motor real + compatibilidad | `PHASE0-1-RELEASE.md` |
| 2: Model Gateway | (`f327579`→`431f5b4`, resumen en PHASE3) |
| 3: Agent Runtime | `PHASE3-AGENT-RUNTIME.md` |
| 4: Control Center | `PHASE4-CONTROL-CENTER.md` |
| 4.2: Hardening | `PHASE42-HARDENING.md` |
| 5/5.1: Knowledge / Memory | `PHASE5-KNOWLEDGE-MEMORY.md` · `PHASE51-MEMORY-MANAGER.md` |
| 5.2: RAG gate | `PHASE52-RAG-EVALUATION.md` |
| 6: Workflows | `PHASE6-WORKFLOW-ENGINE.md` |
| 7: Integrations & MCP | `PHASE7-INTEGRATIONS.md` |
| 8: Operations & Governance | `PHASE8-OPERATIONS-GOVERNANCE.md` |
| 9: Studio | `PHASE9-STUDIO.md` |
| Límites conocidos | `LIMITS-ADR.md` |

## Mejoras pendientes (derivadas del uso real — no por anticipado)

1. **Disco del VPS** (98%→48% tras limpieza; vigilar) — ampliar o mover builds de docker.
2. Precisión de ranking RAG en producción (Precision@3=0.333 de línea base — corpus
   congelado; medir mejoras contra él).
3. Idempotencia: ámbito de operación explícito por workflow (hoy 24 h global).
4. Persistencia de métricas agregadas (hoy en proceso; la auditoría JSONL ya persiste
   eventos).
5. Editor visual: validación en vivo contra el backend + autolayout; SDK/CLI de specs.
6. MCP: sesiones/sampling; herramientas de integración con reconciliación.
