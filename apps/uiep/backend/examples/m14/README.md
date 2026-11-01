# Ejemplos ejecutables M14 — Execution Sandbox & Quality Engine

Requisitos: el sandbox de producción debe estar configurado (env `SANDBOX_URL`,
`SANDBOX_EXEC_TOKEN`, `UIEP_RUNNER_TOKEN`) y los artefactos generados por los
ejemplos de M13 (`../m13/`). Autenticación: sesión de consola (cookie) +
`x-uiep-console: 1`.

```bash
B=https://uiep.manuelalvarez.dev/_uiep/api/console

# 0) Estado del sandbox (configurado/sano y sus garantías):
curl -s -b cookie.txt $B/engineering/sandbox | jq

# 1) API Runtime — invocar un endpoint del contrato generado:
#    el sandbox valida el contrato (método/ruta/campos/constraints/rate-limit)
#    y sirve el endpoint vinculado a un agente REAL vía runner.
curl -s -b cookie.txt -X POST $B/engineering/api-platform/m13-api-tickets/runs \
  -H 'content-type: application/json' -H 'x-uiep-console: 1' \
  -d @apps/uiep/backend/examples/m14/run-api-endpoint.json | jq

# 2) Agentic App Runtime — ejecutar la app completa (agentes + workflow):
curl -s -b cookie.txt -X POST $B/engineering/agentic-app/app-agentica-soporte-m13/runs \
  -H 'content-type: application/json' -H 'x-uiep-console: 1' \
  -d @apps/uiep/backend/examples/m14/run-agentic-app.json | jq

# 3) Dataset Runtime — evaluar un agente contra el dataset (métricas + veredicto):
curl -s -b cookie.txt -X POST $B/engineering/evaluation/m14-dataset-demo/runs \
  -H 'content-type: application/json' -H 'x-uiep-console: 1' \
  -d @apps/uiep/backend/examples/m14/run-dataset.json | jq

# 4) Quality Engine — informe en 4 dimensiones (schema/refs/security/behavior):
curl -s -b cookie.txt -X POST $B/engineering/quality/AgenticApp/app-agentica-soporte-m13 \
  -H 'content-type: application/json' -H 'x-uiep-console: 1' \
  -d @apps/uiep/backend/examples/m14/run-quality.json | jq

# 5) Calidad de un PROYECTO completo (static; behavior con {"behavior":true}):
curl -s -b cookie.txt -X POST $B/engineering/projects/saas-soporte-m13/quality \
  -H 'content-type: application/json' -H 'x-uiep-console: 1' -d '{}' | jq

# 6) Execution Registry — trazabilidad completa:
curl -s -b cookie.txt $B/engineering/executions?limit=20 | jq
curl -s -b cookie.txt $B/engineering/executions/<runId> | jq

# 7) Cancelar una ejecución en curso:
curl -s -b cookie.txt -X POST $B/engineering/executions/<runId>/cancel -H 'x-uiep-console: 1' | jq
```

## Qué garantiza el sandbox (y cómo se comprueba)

| Garantía | Mecanismo | Verificación |
|---|---|---|
| Sin ejecución de código generado | los artefactos son documentos declarativos; el sandbox los INTERPRETA (nunca eval/require/Function) | schema zod sin campos de código; código del sandbox sin eval |
| Aislamiento de proceso | contenedor `uiep-sandbox` separado del backend | `docker inspect` → ReadonlyRootfs, CapDrop ALL, no-new-privileges |
| Sin salida a internet | red docker `uiep-internal` con `internal: true` | `docker network inspect uiep-internal` → "Internal": true |
| Sin FS ni socket de Docker | sin volúmenes montados, rootfs read-only, tmpfs /tmp 64MB noexec | `docker inspect` → Mounts vacío, ReadonlyRootfs: true |
| Límites de recursos | mem_limit 256m, pids_limit 64, ulimits nproc/nofile, timeout por job con aborto real | tests de timeout/cancelación; `docker inspect` |
| Secretos controlados | tokens por env, jamás en artefactos/registros/exports; logs del sandbox solo metadatos | tests de redacción (invocationSummary solo chars/keys) |
| Auditoría por ejecución | Execution Registry (runId, artefacto+versión, límites, métricas, estado) + audit del observability | `/engineering/executions` |
| Fail-closed | sin SANDBOX_URL/TOKEN → 503 `sandbox_disabled`; NADA se ejecuta en el proceso principal | test 1 del suite |

## Honestidad (qué NO es este sandbox)

- NO ejecuta código arbitrario (no hay generación de código ejecutable en
  UIEP: los artefactos son documentos). Si en fases futuras hay contenido
  ejecutable real, se requerirá un aislamiento por-job adicional.
- Los turnos de agente/workflow siguen ejecutándose en los runtimes del
  backend (con sus propios límites y backpressure ya auditados); el sandbox
  orquesta, impone límites del contrato y mide.
- No hay aún exposición PÚBLICA de los endpoints generados (requeriría ruta
  Traefik dedicada); el API Runtime es invocable vía BFF de consola.
