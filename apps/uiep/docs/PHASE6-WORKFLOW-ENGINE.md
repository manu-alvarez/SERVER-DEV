# Fase 6 — Workflow Engine & Orchestration

Estado: implementado y desplegado. **124/124 tests** (+7 de workflow) · Secret Scan verde ·
**Criterio de éxito cumplido en producción** (workflow real completo, trazabilidad por
nodo). Motor PROPIO y determinista: cero n8n/LangGraph/CrewAI, cero ejecución de código
arbitrario, cero dependencias nuevas.

## Criterio de éxito (producción, qwen3.5:4b real)

Workflow `wf-fase6-verificacion` (registrado por consola, validado estructuralmente):

```
202 wfr-mvwgorz8-bfvurq → completed
  investigador (demo-kb-fase5, RAG)   completed 44.4s intentos=1
    out: "El código de verificación de la fase 5 es F5-7731-VERDE [1]."
    agente=run-d948b9b97eba…   ← trazabilidad nodo→run del agente
  analizador (demo-analizador)        completed 11.4s
    out: "F5-7731-VERDE"             agente=run-8730680b6935…
  decision (condition contains)       completed 1ms
    out: "TRUE (contains 'F5-7731-VERDE')"  → rama redactor
  redactor (demo-redactor)            completed 13.9s
    out: "Informe final de verificación completado para la unidad F5-7731 con estado VERDE…"
  sin-codigo                          skipped (rama no tomada)
output final = informe del redactor
```

Investigador con recuperación RAG del propio agente → analizador extrae el código →
decisión condicional enruta → redactor produce el resultado final — con ejecución
PERSISTENTE, trazabilidad por nodo (incluida la sesión/run del agente de cada nodo) y
visualización en el Control Center (página Workflows: inspector de nodos en vivo).

## WorkflowSpec v1 (agent-spec v0.4.0, aditivo)

Nuevo kind `Workflow` en el paquete de contratos:

- Nodos: `agent` (AgentSpecId registrado + plantilla de entrada + retries 0-3 +
  timeout opcional), `condition` (predicado determinista: contains / equals /
  not_empty / starts_with, con caseSensitive → then/else), `parallel` (1-8 ramas
  agent, join etiquetado).
- Conexiones: secuencia implícita (orden de `nodes`) + ramas explícitas de
  condition/parallel. Entradas por plantillas deterministas `{{input}}`, `{{prev}}`,
  `{{nodeId}}` — el motor SUSTITUYE, nunca evalúa código.
- **Validación estructural** en el registro (validateSpec → Workflow): esquema +
  ids únicos + referencias existentes + **DAG sin ciclos** (DFS) + ramas de parallel
  apuntando a nodos agent. Un WorkflowSpec inválido no se registra.

## Workflow Runtime (motor propio)

- **Ejecución asíncrona persistente**: `POST …/run` → 202 {workflowRunId}; el run
  (estado + pasos por nodo + salidas + errores) se persiste atómicamente y se consulta
  por polling (mismo patrón que los agentes).
- **Cancelación en punto seguro**: `cancel` marca la bandera; el motor para ENTRE nodos
  (nunca a mitad de un turno de agente) → `cancelled` (pasos pendientes → cancelled).
- **Reanudación**: `resume` re-ejecuta desde el primer nodo no completado reutilizando
  las salidas persistidas de los completados (determinista; probado con fallo real del
  proveedor y recuperación del flujo).
- **Reintentos y timeout por nodo** (retries 0-3, `WORKFLOW_NODE_TIMEOUT_MS`=180s) y
  deadline global (`WORKFLOW_MAX_RUNTIME_MS`=600s).
- **Paralelo controlado**: tope de concurrencia (`WORKFLOW_MAX_CONCURRENCY`=4) y
  tope de workflows simultáneos (`WORKFLOW_MAX_CONCURRENT_RUNS`=4 → 429).
- **Sweep de arranque**: workflows huérfanos tras reinicio del contenedor →
  `failed` con `workflow_restarted` (nunca simulado).
- **Integración por herencia**: cada nodo agent ejecuta el pipeline completo del
  Agent Runtime en SU propia sesión aislada — model gateway, tools cerradas, knowledge
  bindings y memory del PROPIO agente. Nada nuevo que autorizar a nivel workflow
  (los permisos siguen siendo explícitos por agente).

## Estado y trazabilidad

Un fichero JSON por ejecución (DATA_DIR/workflow/, escritura atómica con **mutex por
runId** — la persistencia concurrente de ramas paralelas colisionaba el rename y la
suite lo detectó): pasos con estado/intentos/entrada renderizada/salida/errores/
duración + agentSessionId/agentExecutionId por nodo agente + branchOutputs en
paralelos. Backup de 4.2 lo cubre automáticamente.

## API

**Bearer**: `POST /api/workflows` (registro validado) · `GET /api/workflows[/:id]` ·
`POST /api/workflows/:id/run` (202) · `GET /api/workflow-runs[/:id]` ·
`POST /api/workflow-runs/:id/cancel` · `POST /api/workflow-runs/:id/resume`.
**Consola** (cookie+CSRF): espejo en `/api/console/workflows/*`.

## Control Center

Página **Workflows**: listado de specs (ejecutar/editar), editor JSON con validación
del contrato (el producto pidió motor primero; el editor visual de nodos queda para
después del motor), entrada del workflow, listado de ejecuciones con estado y progreso
(nodos completados/total), **inspector por nodo** (estado, intentos, duración, entrada
renderizada, salida, errores, trazabilidad hacia la sesión/run del agente, ramas del
paralelo) y acciones cancelar/reanudar.

## Tests (+7, `workflow-engine.test.ts`)

Validación estructural (duplicados, referencias fantasma, ciclos, rama no-agent) ·
secuencia de 2 agentes con transferencia `{{prev}}` (el nodo 2 recibe la salida del 1) ·
condición determinista (rama tomada ejecuta, no tomada → skipped) · parallel (ramas en
paralelo, join etiquetado, nodo posterior) · fallo con FAIL_ONCE → failed + REANUDACIÓN
(el nodo completado NO se re-ejecuta; el fallido sí, y completa) · cancelación en punto
seguro · herencia de knowledge en nodo agent (el nodo responde con RAG + [1]).

## Restricciones respetadas

Sin dependencias de orquestación externas · motor propio agnóstico · sin ejecución de
código arbitrario · límites de concurrencia/consumo · JSON se mantiene (4.1 sigue
diferida) · servicios existentes sin tocar fuera del alcance (solo aditivo: rutas,
servicio y esquema nuevos).
