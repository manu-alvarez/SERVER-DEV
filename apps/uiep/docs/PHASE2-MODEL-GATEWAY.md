# Fase 2 — Model Gateway: perfiles de modelo reales, resolubles y verificados

Estado: implementado, 57/57 tests, desplegado con ancla de rollback.

## Alcance cerrado (Fase 2)

Sustituir las referencias genéricas (`model.profile`) por perfiles registrados, validables y
resolubles, con adaptador inicial de Ollama. **Fuera de alcance**: runtime multiagente,
streaming, otros proveedores (la enumeración `ProviderSchema` ya los acepta; el gateway
los rechaza con `unsupported_provider` hasta tener adaptador).

## Piezas

| Pieza | Dónde | Papel |
|---|---|---|
| `ModelProfile` v1 | `agent-spec/src/model-profile.schema.ts` (pkg v0.2.0) | Contrato agnóstico de proveedor: `provider`, `model`, `endpointEnv` (nombre de variable, nunca la URL), `capabilities`, `contextWindow`, `costTier`, `secretsRef`. |
| `validateSpec/parseSpec` | `agent-spec/src/validate.ts` | Despacho polimórfico por `kind` ('Agent' \| 'ModelProfile'); cada esquema pina su kind con literal. |
| `model-gateway.service` | backend | `resolveModelRef(profileRef)` → perfil registrado; adaptador **Ollama** (fetch nativo, 0 deps): `checkProfileHealth` (GET /api/tags + modelo presente) y `profileTestCompletion` (POST /api/chat con `think:false` para modelos reasoning como qwen3.5/deepseek-r1, fallback a `/api/generate` en ollama <0.9, `num_predict` 8 + strip del reasoning en línea). |
| Registro polimórfico | `spec-registry.service` | Los profiles viven en el MISMO almacén que los specs (`DATA_DIR/specs/*.json`, volumen compose); `listSpecs({ kind })` filtra aditivamente. |
| Endpoints | `routes/model-gateway.ts` | `POST /api/profiles` (201/400) · `GET /api/profiles` · `GET /api/profiles/:id` · `GET /api/profiles/:id/health` (disponibilidad real) · `POST /api/profiles/:id/test` (completación real acotada) · `POST /api/profiles/resolve` (desde profileId o AgentSpec completo). |
| Seed idempotente | `server.ts` | Arranque registra el perfil `default` si ese id no existe: ollama + `qwen3.5:4b` (ctx 262144, verificado vía /api/tags real). |

## Decisiones

1. **AgentSpec no cambia** (ni un campo): sigue agnóstico de proveedor. La resolución lee
   `spec.model.profile` tal cual — `'default'` ahora es un perfil real registrado.
2. **Sin secretos**: los perfiles referencian el endpoint por su variable de entorno
   (`endpointEnv`); el valor real (`OLLAMA_BASE_URL`) vive en el despliegue. En compose:
   `- OLLAMA_BASE_URL=${UIEP_OLLAMA_BASE_URL:-http://172.20.0.1:11434}` (gateway del bridge;
   verificado `REACH_OK` desde el contenedor; customizable en el VPS mediante
   `infrastructure/.env` sin tocar el repo).
3. **Zero dependencias nuevas**: adaptador con `fetch` nativo de Node 22 + `AbortSignal.timeout`.
4. zod descarta campos no declarados (strip): una credencial pasada por error en un perfil no
   se persiste (test lo afirma).
5. Ollama corre en el propio VPS (`systemd`, bind `*:11434`, 4 modelos). **No se tocó
   ningún servicio del VPS**; el contenedor lo alcanza por `172.20.0.1:11434`.

## Endpoints (aditivos; legacy intacto)

```
POST /_uiep/api/generate            — sin cambios (contrato legacy + agentSpec aditivo)
GET  /_uiep/api/profiles            — listado de ModelProfiles
GET  /_uiep/api/profiles/:id        — perfil (404/400 saneo anti path-traversal)
GET  /_uiep/api/profiles/:id/health — { ok, provider, model, endpoint: 'env:…', detail }
POST /_uiep/api/profiles/:id/test   — completación real (≤8 tokens) con latencia
POST /_uiep/api/profiles/resolve    — { profileId | agentSpec } → { resolved, invocation }
```

La URL resuelta nunca sale en las respuestas (solo la referencia `env:NOMBRE_VAR`).

## Fase 1 (registro previo, `972b73f` → `f327579`)

- `@uiep/agent-spec` v0.1.0 (contrato Agent v1) + `deriveAgentSpec()` en el motor
  (specs siempre válidos, agnósticos de framework) + API `POST/GET /api/specs` +
  persistencia atómica con volumen `uiep-backend-data`.
- Corrección de entorno durable: en `.git/config`, el reset `credential.helper=""` debe ir
  ANTES del helper de gh (un reset posterior borra los helpers previos).
