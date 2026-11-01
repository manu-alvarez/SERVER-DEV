# UIEP — Contratos M14 (Execution Sandbox & Quality Engine)

Referencia de lo añadido en la Misión 14 (`uiep-1.5.0`). M12/M13 siguen vigentes
(`docs/UIEP-M12-CONTRATOS.md`, `docs/UIEP-M13-CONTRATOS.md`).

## 1. Arquitectura de ejecución (aislamiento REAL)

```
consola/BFF (uiep-backend:4000)                    uiep-sandbox:4100
  POST /engineering/{kind}/{id}/runs  ──job──▶  /v1/execute (Bearer SANDBOX_EXEC_TOKEN)
  ◀── registro + resultado ────────────────────  intérprete de artefactos declarativos
                                                       │ callbacks (Bearer UIEP_RUNNER_TOKEN)
                                                       ▼
                                            /api/runner/* (runtimes existentes:
                                            agent-runtime, workflow-engine)
```

- El sandbox es un CONTENEDOR aparte: `read_only`, `tmpfs /tmp 64MB noexec`,
  `cap_drop: ALL`, `no-new-privileges`, `pids_limit 64`, `mem_limit 256m`,
  ulimits nproc/nofile, red docker `uiep-internal` con `internal: true`
  (SIN salida a internet — verificado: DNS no resuelve), sin volúmenes ni
  socket Docker.
- Sin dependencias npm (node:http puro) → superficie mínima.
- **Fail-closed absoluto**: sin `SANDBOX_URL`/`SANDBOX_EXEC_TOKEN` las
  ejecuciones responden 503 `sandbox_disabled` y NUNCA se ejecuta nada en el
  proceso principal (no hay fallback in-process).

## 2. Endpoints nuevos (BFF de consola, cookie + CSRF; `execLimiter` 12/min)

| Endpoint | Qué hace |
|---|---|
| `GET /api/console/engineering/sandbox` | estado (configured/healthy/mode/image) |
| `POST /api/console/engineering/{kind}/{id}/runs` | ejecuta `agentic-app` / `api-platform` / `evaluation` / `harness` (body: `{version?, invocation:{input?, agentSpecId?, endpointId?, method?, body?, timeoutMs?≤300000}}`) → 201 con el registro de ejecución |
| `GET /api/console/engineering/executions?limit=` | lista (runId/kind/artifact/status/duración) |
| `GET /api/console/engineering/executions/:runId` | detalle completo (result, logs redactados, límites, sandbox) |
| `POST /api/console/engineering/executions/:runId/cancel` | cancelación real (aborto del job en el sandbox) |
| `POST /api/console/engineering/quality/{kind}/{id}` | informe de calidad (body: `{version?, behavior?:{agentSpecId, timeoutMs?}}`) |
| `POST /api/console/engineering/projects/:id/quality` | calidad por lotes del proyecto (behavior opcional) |

## 3. Runner (servicio↔servicio, token dedicado timing-safe)

- `POST /api/runner/agents/:agentSpecId/runs {input}` → `{executionId}` (201)
- `GET /api/runner/agents/runs/:executionId` → estado + texto SOLO en terminal
- `POST /api/runner/workflows/:workflowId/runs {input}` → `{workflowRunId}`
- `GET /api/runner/workflows/runs/:workflowRunId` → estado + output + steps
- Sin `UIEP_RUNNER_TOKEN` → 503 `runner_disabled` (fail-closed).

## 4. Límites y garantías (verificados por tests y en producción)

| Garantía | Valor | Verificación |
|---|---|---|
| Body del job | ≤ 512 KB | rechazo 413 |
| Timeout de job | 2s–300s (aborto real + log) | test de timeout; prod: 300191ms→timeout |
| Concurrencia | 2 jobs en el sandbox + 2 slots en el orquestador | 429 `sandbox_busy`/`execution_busy` |
| Pasos por job | ≤ 50 turnos agénticos | guard en intérprete |
| Rate limit de contrato | por endpoint declarado (prod: 429 verificado) | test + prod |
| Cancelación | AbortController + limpieza (0 jobs huérfanos) | test + prod (46s→cancelled) |
| Red | internal:true sin salida (EAI_AGAIN) | docker network inspect |
| Secretos | tokens por env; invocaciones REDACTADAS (chars/keys, jamás valores); logs solo metadatos | tests de redacción |
| Auditoría | cada ejecución queda en Execution Registry + audit trail del observability | `/engineering/executions` |

## 5. Quality Engine — 4 dimensiones

1. **schema**: el documento valida contra su zod.
2. **references**: componentRefs/specRefs resueltas contra los almacenes reales.
3. **security**: sin valores sensibles incrustados (scanner de claves
   password/token/secret/apikey — deben viajar por referencia `env:VAR`).
4. **behavior**: dataset/harness EJECUTADOS en el sandbox contra el target;
   métricas deterministas (F1 token-level + ratio de casos); dataset sin
   thresholds → exigencia TOTAL (ratio 1.0); un caso solo pasa si el turno
   del agente terminó `completed*`.

Veredicto honesto: `pass` solo si TODAS las dimensiones pasan.

## 6. Honestidad — límites conocidos (deuda)

- Los turnos agénticos siguen corriendo en el backend (runtimes M2–M8 con sus
  propios límites); el sandbox orquesta/mide/corta — no hay ejecución de
  código arbitrario (no existe: los artefactos son declarativos).
- Sin exposición PÚBLICA de endpoints generados (requeriría ruta Traefik
  dedicada); el API Runtime se invoca vía BFF de consola.
- Sin reconciliación de runs zombis del Execution Registry (si el proceso
  cliente muere, un run puede quedar `running`; sweep → deuda M15).
- Contención de Ollama con otras apps del host: turnos de 18–120s según carga.
