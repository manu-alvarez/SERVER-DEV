# Fase 8 — Platform Operations & Governance (consolidación transversal)

Estado: implementado y desplegado. **135/135 tests** (+4) · Secret Scan verde · evidencia
de producción real. CERO motores nuevos, cero bases de datos nuevas, cero dependencias
nuevas — servicios TRANSVERSALES sobre lo existente (JSON, Ollama, motor propio, MCP
como adaptador, gate determinista: intactos).

## A. Reliability Engine

| Mecanismo | Implementación |
|---|---|
| **Idempotencia de efectos externos** | Libro `reliability/idempotency.json` (bajo DATA_DIR → backup incluido): clave determinista (integración+método+path+hash del body). Un resultado COMPLETADO se **REPRODUCE** sin repetir el efecto (el escenario exacto de la reanudación de workflows); un resultado INCERTO (fallo de red tras enviar) se registra como incierto y se re-ejecuta con aviso — jamás se simula un éxito. TTL 24 h + purga perezosa. |
| Registro de estados de ejecución | Cada llamada externa queda en el libro + auditoría; cada tool/agent/workflow con sus métricas. |
| Política de reintentos segura | Reintentos por nodo (Fase 6) + replay de idempotencia (Fase 8): el reintento tras fallo de red re-ejecuta (incierto); el reintento tras éxito no persistido reproduce (completado). |
| Tratamiento de resultados inciertos | Explícito en el libro (outcome 'uncertain') — nunca un éxito simulado. |
| **Límites globales** | Semáforos de TODO el proceso: `RUNTIME_MAX_CONCURRENT_RUNS` (8) y `WORKFLOW_MAX_CONCURRENT_RUNS` (4) → **429 backpressure en el borde**; el slot se sostiene hasta que el turno en background TERMINA (no al despacharlo). |

## B. Observability

- **Correlación completa**: workflowRunId → (nodo →) agentRunId → sesión del agente →
  tool → integración. Los IDs ya vivían en los run records; ahora la auditoría y el
  logging los propagan.
- **Logging estructurado**: `logStructured` (JSON lines con ts/level/scope/correlación).
- **Métricas** (en proceso, sin dependencias): llamadas/errores/latencia media y máxima
  por plano: integración, tool, agente, workflow, mcp. `result.tokens` captura el
  consumo REAL del proveedor (ollama prompt_eval_count/eval_count) acumulado por turno.
- **Panel de salud**: página **Observabilidad** en el Control Center — métricas por
  plano, límites vigentes en vuelo, integraciones registradas, cola de auditoría.
- **Historial de fallos**: errores de runs/workflows persistidos + `lastError` por serie
  de métricas.

## C. Resource Governance

- Cuotas de ejecución: semáforos globales (arriba) + rate-limit de login (4.2) +
  rate-limit global de API (Fase 0) + topes de concurrencia por workflow (6).
- Control de consumo de contexto: `RUNTIME_MAX_CONTEXT_CHARS`/`RUNTIME_MAX_INPUT_CHARS`
  (existentes, ahora visibles como límites del sistema).
- Protección frente a ejecuciones descontroladas: backpressure 429 + timeouts por nodo
  y globales + circuit breaker (7) — el conjunto del sistema tiene cota.

## D. Security Governance

- **Auditoría de acciones**: JSONL append-only (`audit.jsonl`, rotación 5 MB) —
  login.ok/failed, agent.run.start/finish, integration.call(.replayed/.error),
  memory.delete, knowledge.source.delete, workflow.* — con actor (console/agent/mcp/
  hook/system) y correlación. **Sanitizado**: claves secret-like → `[redacted]` (test +
  evidencia: la contraseña de consola NO aparece en la observabilidad).
- Ciclo de vida de secretos: rotación documentada (4.2) + referencias `secretEnv` (7).
- Exposición MCP: allowlist por env, solo lectura por defecto (7).
- Retención: TTL de memoria (5.1) + rotación de auditoría + purga del libro.
- Aislamiento entre agentes: verificado por tests (5.2) — denegación por defecto.

## E. Control Center

Página **Observabilidad** (nueva): métricas por plano con tasa de error y latencias,
límites globales en vuelo, integraciones registradas y cola de auditoría (últimos 60
eventos) — refresco 15 s. Las páginas existentes muestran la trazabilidad de su plano.

## Evidencia de producción (real)

```
O2 run A: tool http-call REAL  {"status":200,"body":"…user-agent…","durationMs":391}
O3 run B (misma operación):    {"…","durationMs":0,"idempotentReplay":true}
O4 IDEMPOTENCIA CUMPLIDA — la 2ª llamada reprodujo el resultado persistido
   (cero segundo efecto externo)
O5 observability 200 · series=3 · límites {agent 0/8, workflow 0/4}
O6 agent:demo-int-fase7 → calls=2, errors=0, avg=36.9s, max=57.5s
O7 auditoría: [agent.run.start] [integration.call.replayed] [agent.run.finish]…
O8 la contraseña de consola NO aparece en ninguna respuesta de observabilidad
O9 tokens reales del proveedor en el run: {"prompt":667,"completion":37}
```

## Tests (+4, `phase8.test.ts`)

Idempotencia: clave estable, body distinto → clave distinta, completed → reproducible,
uncertain → sin resultado reproducible · backpressure: límite 2 → 3ª adquisición
falla → liberación restaura · auditoría: correlación presente, secretos sanitizados
(contrasentido imposible en el fichero), cola legible · métricas: contadores, ratio de
error, latencia media/máxima.

## Lección de proceso (registrada)

La primera batería de evidencia de esta fase dio 404 en /api/console/observability:
los cambios backend de la fase NO estaban commiteados (los commits de Fase 8 eran solo
web). El VPS — construido desde el árbol git — servía el binario antiguo. La disciplina
de cierre de bloque pasa a ser: **commit del backend junto con su fase y verificación
de que el binario del contenedor contiene lo esperado** (`docker exec … grep`) antes de
ejecutar la batería.
