# Fase 7 — Integration & Extension Ecosystem

Estado: implementado y desplegado. **131/131 tests** (+7) · Secret Scan verde · evidencia
de producción real (integración HTTP pública consumida por un agente, round-trip MCP
client→server, webhook externo → workflow). Sin dependencias nuevas, sin servicios de
pago. agent-spec **v0.5.0** (aditivo: kind `Integration` + adapters `http-call`/`mcp-call`).

## Decisión arquitectónica (fijada)

**MCP NO es el núcleo de UIEP** — es un protocolo de interoperabilidad dentro del
ecosistema. El contrato interno de herramientas (ToolSpec cerrada, permisos
deny-by-default) sigue siendo independiente: conectar MCP, APIs REST o servicios propios
son ADAPTADORES en la capa de ejecución de tools (`executeTool`), sin tocar Agent
Runtime ni Workflow Engine.

## Componentes

| Componente | Dónde | Papel |
|---|---|---|
| Integration Registry | spec-registry (kind `Integration`) + `integration.service` | Catálogo versionado de proveedores: tipo (`http-api` \| `mcp-server`), baseUrl, healthPath, timeout, cabeceras estáticas. Health checks reales. |
| Auth por referencia | `auth.secretEnv` | El spec guarda el NOMBRE de la env var; el valor se resuelve SOLO en el proceso (bearer o header custom) y jamás se persiste ni se sirve (test dedicado). |
| Connector Runtime | adapters `http-call` (tool-registry) | HTTP/API con timeout, circuit breaker por integración (5 fallos consecutivos → abierto 60 s → fallo explícito rápido), reintentos a nivel tool. Invariante anti-SSRF: la URL la define el OPERADOR en la ToolSpec (host/path); el dato del agente viaja SOLO en el body. |
| MCP client | `mcp-client.service` | JSON-RPC 2.0 sobre HTTP SIN ESTADO: `tools/list` (descubrir) + `tools/call` (ejecutar) con los timeouts/breaker del conector. Sesiones/sampling de MCP: evolución documentada. |
| MCP server | `routes/mcp-server.ts` (`/api/mcp-server`) | UIEP como servidor MCP: expone SOLO el allowlist (env `UIEP_MCP_EXPOSED_TOOLS`, default `clock,runtime-info`) vía los MISMOS adaptadores cerrados (un solo motor). Bearer; las tools de efectos nunca expuestas por defecto. La ruta legacy `/api/mcp` (Fase 0) no se toca. |
| Webhooks entrantes | `routes/hooks.ts` | `POST /api/hooks/:hookId` (token por referencia, timing-safe) → arranca un workflow registrado con el payload como `{{input}}` (puente eventos externos → motor Fase 6). Sin `UIEP_HOOKS` → deshabilitado. |
| Control Center | `pages/Integrations.tsx` | Catálogo (tipo/baseUrl/auth-ref), health button con resultado real, descubrimiento de herramientas MCP por servidor, alta por JSON validado. La página Herramientas muestra el ORIGEN de cada tool (core / memoria / integración / MCP). |

## Evidencia de producción (qwen3.5:4b real)

```
I1 IntegrationSpec int-httpbin-prod → 201 (https://httpbin.org)
I2 health real                     → 200 accesible (586 ms)
I3 agente demo-int-fase7 (tool ext-httpbin-headers declarada+autorizada)
   → 202 run-79c8eab1d7e5 → completed
I4 tool http-call ejecutada: {"status":200,"body":"{\"user-agent\": \"node\"}","durationMs":462}
I5 respuesta: "La respuesta de la API externa indica que el User-Agent es 'node'."
I6 MCP discovery (server propio): tools=["clock","runtime-info"]
I7 webhook → workflow: bad token 401 · token OK → 202 wfr-mvwhvzzv-nl4aow
   → workflow completed: "El webhook externo ha enviado una alerta crítica sobre el disco…"
```

El ciclo completo del ecosistema: evento externo → webhook autenticado → workflow →
agentes (RAG/memory/tools) → conector saliente a API externa → respuesta integrada.

## Seguridad (resumen)

- Secretos: solo referencias `secretEnv`; resolución in-proceso; jamás en specs,
  respuestas, logs ni este repositorio.
- Superficie: `/api/mcp-server` y hooks exigen token (timing-safe); hooks
  deshabilitados sin config; allowlist MCP restrictiva por defecto.
- SSRF: ingesta de conocimiento (URLs no confiables) mantiene el guard estricto de
  5.1; los conectores usan destinos configurados por el operador y el dato del agente
  nunca construye el destino.
- Breaker + límites de concurrencia heredados del workflow engine (los límites
  globales de recursos siguen como requisito de evolución).

## Tests (+7, `integrations.test.ts`)

Registro con assertion de que el valor del secreto nunca se persiste/sirve (solo la
referencia) · health real · inyección de auth bearer y header custom desde env ·
circuit breaker (5×500 reales → 6º con circuito abierto sin tocar el proveedor) · MCP
server: rechazo sin token (-32001), allowlist exacta, tools/call de clock real,
memory-write denegada (-32602) · round-trip MCP client→server completo (descubrir +
llamar) · agente consumiendo la API externa vía tool http-call (el turno viaja como
body; la URL intacta).
