# Fase 0 — Decisión de formato de módulos (ETAPA 2)

Estado: **aplicada** · Base de trabajo: `40a1042` · Fecha: 2026-10-30

## Contexto

El monorepo UIEP compilaba con `module: ESNext` + `moduleResolution: bundler` (heredado del
`tsconfig.json` raíz) sin declarar `"type": "module"` en ningún `package.json`. Resultado real:

- Los `dist/*.js` eran **ESM escrito en archivos `.js` interpretados como CommonJS** por Node:
  `require()` fallaba con `Cannot use import statement` / `ERR_REQUIRE_ESM`.
- Los `exports` solo mapeaban la condición `"import"` — un `require()`ría fallado **incluso** con
  contenido CommonJS (condición no resuelta → `ERR_REQUIRE_ESM` doble causa).
- El backend de producción (`node server.js`, CommonJS) no podía consumir `@uiep/*` por ninguna vía.

## Decisión

Compilar los 9 paquetes del engine a **CommonJS** y exponerlo en `exports`:

- `packages/{auth-system,design-engine,entity-registry,entity-schema,framework-adapter,memory-system,meta-generator,monitoring,plugin-system}/tsconfig.json`
  → `"module": "CommonJS"`, `"moduleResolution": "node10"`.
- `packages/*/{package.json}.exports.` → añadir `"require": "./dist/index.js"` y `"default": "./dist/index.js"`
  (se conserva `"import"` y `"types"`).
- `packages/ui` **permanece ESM/bundler**: solo lo consume Vite (`apps/web`), nunca Node CommonJS.

## Alternativa descartada: conservar ESM (`"type": "module"`)

Viable en Node 22, pero implicaba:

1. Reescribir **87 imports relativos** para añadir extensión `.js` (en node10/ESM y en bundlers con fear de extensiones… en `import` syntax es obligatoria en runtime ESM).
2. Revisar y duplicar condiciones de `exports` igualmente.
3. Mantener un monorepo mixto (backend CJS `require(esm)` — soportado en Node 22.23.1 pero con
   costes de interop y replicación en cada consumidor).

La ruta CommonJS logra el objetivo de Fase 0 (backend consume el motor con `require`) con **cero
cambios de código fuente**, y el VPS (Node 22.23.1) la soporta de forma nativa.

## Tradeoff aceptado

- Los artefactos **generados** por el motor (strings embebidos en `generator.ts`) no cambian.
- Un consumidor ESM/loaders futuros sigue sirviéndose de la condición `import` (que ahora apunta al
  mismo CJS; los bundlers hacen interop). Migración a ESM/nativodual se docume cuando AgentSpec
  (Fase 1) exija contratos versionados del paquete.

## Evidencia

1. `corepack pnpm@9.15.0 -r --filter "./packages/*" build` — compilación limpia de los 9 paquetes.
2. Smoke runtime: `node -e "require('./packages/design-engine/dist')"` con `runPipeline()` real.
