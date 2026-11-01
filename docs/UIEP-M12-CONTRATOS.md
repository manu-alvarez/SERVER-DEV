# UIEP — Contratos M12 (para el consumo del frontend de consola y para M15)

Referencia estable de los endpoints y formatos introducidos en la Misión 12
(`uiep-1.3.0`). Todos viven en el BFF de consola (`/api/console/…`, cookie de
sesión + header `x-uiep-console: 1` en mutaciones) y respetan los límites:
`genLimiter` 30/min en generate/compositions/export.

## 1. Generator Engine (`engineering-generator.service`)

- `GET /api/console/engineering/generators`
  → `{ engineVersion: '1.0.0', generators: [{ type, label, docKind, outStore, inputShape, capabilities }] }`
  (12 tipos; `capabilities` viene del catálogo honesto del Registry).
- `GET /api/console/engineering/generators/:type` → un generador o 404.
- `POST /api/console/engineering/generators/:type/validate` → dry-run SIN escrituras
  → `{ ok: true, type, checks: [{ name, passed }] }` o `{ ok: false, status, errors }`.
- `POST /api/console/engineering/generate` body `{ type, input }` (201)
  → `{ ok: true, generationId, type, outcome: { store: 'specs'|'engineering', specKind?|artifactKind?, id, version }, extraOutcomes?, reused, warnings, provenance: { generator: { id, version }, generatedAt, inputHash, outputHash }, durationMs, children? }`
  Errores: 400 `unknown_type`/input, 404 `not_generable`, 409 `version_conflict`.
- `GET /api/console/engineering/generations?limit=` y `…/generations/:id`
  → registros de generación (hashes de entrada/salida, resumen SIN contenido,
  children de subgeneraciones; ids `gen-…`).

## 2. Composición de proyectos UES (`engineering-composition.service`)

- `POST /api/console/engineering/compositions` body = proyecto UES donde cada
  artefacto lleva `specRef` (REUTILIZA, verificado contra almacenes reales) o
  `generate` (DELEGA en el Engine) + `dependencies` (orden topológico) y tokens
  `$ref:<ref>` en el input (se sustituyen por el id real generado/reutilizado).
  → 201 `{ ok: true, projectId, version, artifacts: [{ ref, type, action: 'created'|'reused-generated'|'reused-existing', specRef, generationId? }], warnings, generationId, durationMs }`
  → error `{ ok: false, status: 400|422, phase: 'validation'|'generation'|'registration', generationId (grupo), childGenerationId?, artifacts? }`.
  Rollback lógico: proyecto NO registrado si falla una generación; el grupo
  queda en `data/engineering/generations/` con los hijos completados; re-run
  idempotente (upserts por huella).

## 3. Artefactos de ingeniería (almacén M12)

- `GET /api/console/engineering/artifacts` → `{ count, artifacts: [{ kind, id, name, version, lifecycle }] }`.
- `GET /api/console/engineering/artifacts/:kind/:id[?version=]` → `{ version, lifecycle, history, versions[], document }`.
- `POST /api/console/engineering/artifacts/:kind/:id/lifecycle` `{ to, note? }`
  → transición auditable (8 estados; desde `generated` solo `tested|archived`).
- Kinds (10, siempre `data/engineering/artifacts/{kind}/{id}@{version}.json`):
  PromptSystem, SkillPack, McpServerManifest, ToolCollection, RagSystem,
  KnowledgeBase, MultiAgentSystem, EvaluationDataset, Harness, Framework.

## 4. Exportación estructurada (`engineering-export.service`)

- `POST /api/console/engineering/projects/:id/export[?version=]`
- `POST /api/console/engineering/artifacts/:kind/:id/export[?version=]`
- `POST /api/console/engineering/generations/:id/export`
- `GET /api/console/engineering/exports` → ficheros escritos en
  `data/engineering/exports/`.
  → `{ exported: true, format: 'uiep-export-v1', filename, documents[], sizeBytes, sha256 }`
  Bundle JSON reinstalable (equivalente estructurado a ZIP sin dependencias):
  `documents` = mapa de rutas relativas (`specs/…`, `artifacts/…`, `projects/…`,
  `generation.json`) + `readme` con los pasos de re-instalación. Sin secretos y
  sin contenido de entrada del usuario (solo documentos validados + hashes).

## 5. Honestidad (lo que M12 NO hace)

- `execution=false` en el catálogo para evaluation, harness, mcp-server,
  prompt-system, skill-pack, framework y rag-system: se GENERAN documentos
  (datasets/manifiestos/definiciones), pero NO se ejecutan ni despliegan.
- Sin ejecución de código generado, sin shell, sin red salvo servicios
  existentes (ingesta/embeddings). Sandbox → M14.
- El gate RAG (0.70) y el corpus v1.0.0 siguen INTACTOS: el artefacto RagSystem
  declara configuración; el umbral EFECTIVO lo posee el runtime (env).
