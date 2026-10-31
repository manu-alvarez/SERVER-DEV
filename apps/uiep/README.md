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
| Tests | `corepack pnpm --filter uiep-backend test` (137/137 — incluye el GATE de calidad) |
| Desplegar | push a main → en VPS: `git fetch && git reset --hard origin/main` → install → build → compose build+up → **verificar binario servido** (`docker exec … grep`) |
| Rollback | anclas de imagen (`rollback-*`) o rebuild desde el commit de la fase (matriz abajo) |

## Matriz de trazabilidad / rollback (v1.0)

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
