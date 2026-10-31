# Fase 3 — Agent Runtime: agentes ejecutables de extremo a extremo

Estado: implementado, 76/76 tests, desplegado con token de protección y ancla de rollback.

## Ciclo cerrado (criterio de cierre de la fase)

AgentSpec registrado → sesión → ejecución (modelo vía perfil) → herramientas autorizadas →
resultado persistido y recuperable tras reinicio.

## Piezas

| Pieza | Dónde | Papel |
|---|---|---|
| `ToolSpec` v1 | `agent-spec` v0.3.0 (`tool.schema.ts`) | Declarativa: esquema de entrada (subconjunto JSON Schema + `validateToolInput` puro), permisos requeridos, adaptador CERRADO (`clock`, `runtime-info`). Sin código arbitrario, sin shell, sin FS libre. |
| Tool Registry | `backend/services/tool-registry.service.ts` | Registro de tools en el MISMO almacén; aditadores puros; validación de argumentos antes de ejecutar; semillas idempotentes (`clock`, `runtime-info`). |
| Runtime | `backend/services/agent-runtime.service.ts` | Agnóstico proveedor/framework: resuelve AgentSpec registrado → ModelProfile → contexto (rol/objetivo/instrucciones) → bucle secuencial con límites → resultado persistido. HttpMethod NO cambia. |
| Store | `backend/services/agent-runtime-store.service.ts` | Sesiones (`runtime/sessions`) y ejecuciones (`runtime/runs`) en el volumen existente, escritura atómica. Sin secretos ni URLs (solo `env:VAR`). |
| API protegida | `backend/routes/agent-runtime.ts` | `POST /api/runtime/sessions` · `POST /api/runtime/sessions/:id/run` · `GET /api/runtime/sessions/:id` · `GET /api/runtime/runs/:id`. |
| Protección | Bearer `UIEP_RUNTIME_TOKEN` | Sin token configurado → 503 `runtime_disabled` (seguridad por defecto); token incorrecto → 401; comparación timing-safe. El token vive en `infrastructure/.env` del VPS (gitignored). |

## Modelo de herramientas (deny-by-default)

1. No registrada → `tool_not_registered`.
2. No declarada en `spec.tools[].id` → `tool_not_authorized`.
3. Permisos requeridos ⊄ otorgados → `insufficient_permissions` (`'*'` otorga todos).
4. En `security.approvalRequired` → estado `requires_approval` (no simula ejecución).
5. Declarada+registrada+autorizada → ejecución con args validados; resultado devuelto al modelo como mensaje de tool.

## Tool-calling con verificación de capacidad

`modelCapabilities()` lee las capacidades REALES del modelo (`/api/tags`, verificada en
producción: qwen3.5:4b → `["completion","tools","thinking","vision"]`). Si el spec declara
tools y el modelo no soporta llamadas → estado explícito `completed_without_tools` (nunca
resultados simulados). Chat vía `/api/chat` con `think:false` (ollama ≥0.9; fallback a
`/api/generate` en versiones antiguas).

## Límites (env con defaults)

`RUNTIME_MAX_ITERATIONS`=16 · `RUNTIME_TIMEOUT_MS`=180000 · `RUNTIME_MAX_INPUT_CHARS`=4000 ·
`RUNTIME_MAX_CONTEXT_CHARS`=24000. Estados finales: `completed`, `completed_without_tools`,
`max_iterations_reached`, `timeout`, `requires_approval`, `failed` (errores explícitos
persistidos en el run record; error del proveedor → `provider_status_*`).

## Fase 2 (contexto, `f327579` → `431f5b4`)

- `ModelProfile` v1 + `validateSpec` polimórfico; gateway: resolución de perfiles, health real
  (GET /api/tags + modelo presente), completación de prueba (`/api/chat` con `think:false` +
  fallback, tras descubrir que los modelos reasoning devolvían texto vacío con `/api/generate`).
- Endpoints `/api/profiles` (alta/lista/detalle/health/test/resolve); seed `default`
  (ollama `qwen3.5:4b`, ctx 262144); `OLLAMA_BASE_URL` en compose (el contenedor alcanza el
  Ollama del VPS por la gateway del bridge — REACH_OK verificada antes de tocar código).
- Lección operativa: los compose quedaron sin stage en un commit y la batería de evidencia
  de producción lo detectó (`endpoint_env_missing`). Stage explícito por fichero desde entonces.
