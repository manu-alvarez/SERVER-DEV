# UIEP — Contratos M13 (Application & System Generators)

Referencia de lo añadido en la Misión 13 (`uiep-1.4.0`). TODO lo de M12 sigue
vigente (`docs/UIEP-M12-CONTRATOS.md`): mismos endpoints del BFF, mismos
upserts fail-closed `id@version`, mismos registros de generación y misma
exportación `uiep-export-v1`. La versión del motor pasa a **1.1.0** y el
catálogo a **16 generadores** (19 tipos UES; los 3 restantes siguen
schema-only: enterprise-architecture, infrastructure-stack, deployment-architecture).

## 1. Generadores nuevos (mismo motor universal, sin motores paralelos)

| type (input de /generate) | docKind (artefacto) | Qué genera | Qué NO hace |
|---|---|---|---|
| `api-platform` | `ApiPlatform` | Contratos REST tipados (request/response con constraints declarativas, errores, rateLimit) + `openapiLike` determinista (paths/operaciones/schemas derivados de los contratos) + `agentBinding` a agentes REALES verificados | NO sirve endpoints (M14 sandbox); los agentes vinculados ya corren |
| `application` | `Application` | Estructura de app: módulos (`api-platform/frontend/backend/config/library/agent-runtime`) con `componentRef` a artefactos REALES (versión registrada resuelta), `entryModule`, grafo de módulos acíclico, `envVarNames` SIN valores | NO ejecuta el paquete (M14) |
| `agentic-app` | `AgenticApp` | App agéntica con SOLO componentes ejecutables: agentes registrados o subgenerados (`{ generate }` → registros hijo), workflows, tools, knowledge verificados; `surfaces` + `guardrails` | El "paquete app" no se ejecuta como unidad (M14); sus componentes YA corren hoy |
| `saas` | `Saas` | Proyecto compuesto: módulos verificados + `entryModule` + roles con permisos + tenancy `multi-tenant-ready`/`single-tenant-prep` declarativa | Multi-tenancy REAL → fases posteriores (isolation declarativo) |
| `framework` (upgrade) | `Framework` | Además de componentes: `modules` agrupando componentes con dependencias (refs verificadas + aciclicidad) | — |

Todos: `capabilities = { schema: true, generator: true, execution: false, validation: true }`
con `via.execution` documentando qué componentes SÍ se ejecutan hoy.

## 2. Validación (fail-closed, compartida)

- Componentes/módulos: cada `componentRef` se verifica contra los almacenes
  reales (`data/specs` + `data/engineering/artifacts`); dependencias existentes;
  grafo de módulos ACÍCLICO (reutiliza `topologicalOrder` del Registry).
- API: ids únicos, `método+ruta` únicos, path `/`, agentes vinculados existen.
- Application/SaaS: `entryModule` ∈ módulos; `envVarNames` solo NOMBRES
  (`^[A-Z][A-Z0-9_]+$`) — jamás valores; roles ≤ 8 con permisos ≤ 16.
- AgenticApp: TODOS los agentes/workflows/tools/fuentes existen (o se
  subgeneran); el doc registra los ids reales con los que puede ejecutarse.

## 3. Integración con composición y export (sin cambios de contrato)

- Los 4 nuevos `type` funcionan como artefactos de una COMPOSICIÓN
  (`POST /api/console/engineering/compositions`): se pueden generar y
  referenciar con tokens `$ref:` entre sí (api → application → saas).
- Export: los nuevos kinds salen automáticamente en los bundles
  (`artifacts/ApiPlatform/…`, `artifacts/Application/…`, etc.).
- Ciclo de vida: mismos 8 estados; el engine deja los artefactos en `generated`.

## 4. Ejemplos funcionales

`apps/uiep/backend/examples/m13/` — payloads listos + README con los comandos
curl completos (incluye la preparación de los artefactos referenciados y el
proyecto compuesto `saas-soporte-m13`). Re-ejecución idempotente.

## 5. Seguridad (sin cambios respecto a M12)

- Sin ejecución de código generado, sin shell, sin red salvo servicios
  existentes (ingesta/embeddings). Sandbox completo → M14.
- Sin secretos: `envVarNames` (nombres), procedencia por hashes.
- Mismos límites: `genLimiter` 30/min, body 2mb, CSRF + sesión de consola.
