# Fase 1 — AgentSpec v1: crear, validar, registrar y recuperar entidades

Estado: implementado, 35/35 tests, desplegado con el protocolo de ancla/rollback.

## Alcance cerrado (Fase 1)

Contrato versionado + validación + persistencia inicial + integración con el motor.
**Fuera de alcance**: TeamSpec/WorkflowSpec/etc. (la enumeración `kind` crecerá por adición),
runtime de ejecución (Fase 3), Model Gateway (Fase 2), entity-registry package (dormido; su
función la cubre hoy `spec-registry.service` del backend).

## Piezas

| Pieza | Dónde | Papel |
|---|---|---|
| `@uiep/agent-spec` v0.1.0 | `packages/agent-spec` | Contrato v1 (`apiVersion uiep.io/v1`, kind, metadata semver, spec: identity/model por referencia/instructions/capabilities/tools/memory/orchestration/security/evaluation) + validación estructurada. Solo zod. |
| `deriveAgentSpec()` | `design-engine/src/spec/derive.ts` | El motor convierte `PipelineResult` → spec v1 SIEMPRE válido (clamping, slugs, memoria desde recomendaciones). Agnóstico de framework (sin langgraph/gpt-4o — afirmado por test). |
| `spec-registry.service` | backend | Persistencia JSON con escritura atómica (tmp+rename), volumen `uiep-backend-data:/app/data`, listado y latest-by-semver. Cero dependencias. |
| API aditiva | backend | `POST /api/specs` (201/400 por campo) · `GET /api/specs` · `GET /api/specs/:id` (latest, 404, saneo anti path-traversal) |
| Flujo cerrado | backend | `POST /api/generate` deriva el spec, lo registra con consistencia read-after-write y lo devuelve en `agentSpec` (aditivo); fallo de almacenamiento no rompe el contrato. |

## Decisión clave

`model.profile` es **referencia** ('default' hoy) — nunca un modelo incrustado. La ejecución
(Fase 3) decidirá el adaptador; el Model Gateway (Fase 2) resolverá el perfil. El spec describe
QUÉ es; los adaptadores deciden CÓMO se ejecuta.

## Versionado

`SUPPORTED_SPEC_VERSIONS = ['uiep.io/v1']`; versiones desconocidas → error explícito. Migraciones
solo cuando exista una v2 real.

## Nota de entorno (push)

El keychain de macOS quedó bloqueado tras el reinicio del servidor. Config local del repo:
`credential.helper=""` (reset) **antes** de `credential.https://github.com.helper=!gh auth
git-credential` — el orden en `.git/config` es determinante (un reset posterior borra los helpers
previos, incluido gh).
