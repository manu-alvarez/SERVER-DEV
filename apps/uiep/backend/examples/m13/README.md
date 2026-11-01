# Ejemplos funcionales M13 — Application & System Generators

Payloads listos para `POST /api/console/engineering/generate` (los de un solo
tipo) y `POST /api/console/engineering/compositions` (proyecto compuesto).
Autenticación: cookie de sesión de consola + header `x-uiep-console: 1` en las
mutaciones. Límite `genLimiter`: 30 generaciones/minuto.

| Fichero | Capacidad | Qué demuestra |
|---|---|---|
| `api-platform.json` | `type: 'api-platform'` | contratos tipados + validación declarativa + `openapiLike` determinista + `agentBinding` a un agente REAL |
| `application.json` | `type: 'application'` | módulos con `componentRef` a un ApiPlatform REAL (versión resuelta), `entryModule`, `envVarNames` sin valores |
| `framework-modules.json` | `type: 'framework'` | módulos agrupando componentes verificados con dependencias acíclicas |
| `agentic-app.json` | `type: 'agentic-app'` | app con SOLO componentes ejecutables: agente registrado + subgeneración (`generate`), workflow, tool y knowledge reales |
| `saas-composition.json` | composición UES | proyecto compuesto que GENERA api → application → agentic-app → saas con tokens `$ref:` |

## Requisitos previos (los ejemplos referencian ids concretos)

```bash
# 1) Sesión de consola (usa la contraseña del despliegue):
curl -c cookie.txt -X POST https://uiep.manuelalvarez.dev/_uiep/api/console/auth/login \
  -H 'content-type: application/json' -d '{"password":"…"}'
B=https://uiep.manuelalvarez.dev/_uiep/api/console

# 2) El agente/workflow/prompt que referencian los ejemplos:
curl -b cookie.txt -X POST $B/engineering/generate -H 'content-type: application/json' -H 'x-uiep-console: 1' \
  -d '{"type":"agent","input":{"name":"M13 Agente API","role":"atención","objective":"demo","system":"Agente de los ejemplos M13.","memory":{"enabled":false,"strategy":"none"}}}'
curl -b cookie.txt -X POST $B/engineering/generate -H 'content-type: application/json' -H 'x-uiep-console: 1' \
  -d '{"type":"workflow","input":{"name":"M13 Flujo App","steps":[{"agent":"m13-agente-api","input":"{{input}}"}]}}'
curl -b cookie.txt -X POST $B/engineering/generate -H 'content-type: application/json' -H 'x-uiep-console: 1' \
  -d '{"type":"prompt-system","input":{"name":"M13 Prompts Framework","prompts":[{"name":"Eco","template":"eco {{x}}","variables":[{"name":"x","type":"string"}]}]}}'

# 3) Generar un ejemplo (idempotente — la 2ª vez reused:true):
curl -b cookie.txt -X POST $B/engineering/generate -H 'content-type: application/json' -H 'x-uiep-console: 1' \
  -d @apps/uiep/backend/examples/m13/api-platform.json
curl -b cookie.txt -X POST $B/engineering/generate -H 'content-type: application/json' -H 'x-uiep-console: 1' \
  -d @apps/uiep/backend/examples/m13/application.json
curl -b cookie.txt -X POST $B/engineering/generate -H 'content-type: application/json' -H 'x-uiep-console: 1' \
  -d @apps/uiep/backend/examples/m13/agentic-app.json
curl -b cookie.txt -X POST $B/engineering/generate -H 'content-type: application/json' -H 'x-uiep-console: 1' \
  -d @apps/uiep/backend/examples/m13/framework-modules.json

# 4) SaaS compuesto (proyecto UES con 4 artefactos generados en orden topológico):
curl -b cookie.txt -X POST $B/engineering/compositions -H 'content-type: application/json' -H 'x-uiep-console: 1' \
  -d @apps/uiep/backend/examples/m13/saas-composition.json

# 5) Exportar el proyecto compuesto (bundle uiep-export-v1):
curl -b cookie.txt -X POST $B/engineering/projects/saas-soporte-m13/export -H 'x-uiep-console: 1'
```

## Honestidad (qué hace y qué NO hace cada generador)

- **Generan documentos validados** (schema zod + referencias verificadas contra
  los almacenes reales) con procedencia por hash y ciclo de vida auditable.
- **`api-platform`**: el contrato y su documentación OpenAPI-like son reales y
  deterministas; el SERVIDOR de endpoints no existe todavía (M14 sandbox).
- **`agentic-app`**: cada agente/workflow/tool/fuente que lista EXISTE y es
  ejecutable HOY por los runtimes de UIEP; el "paquete app" no se ejecuta como
  unidad (M14).
- **`application`/`saas`**: estructuras de módulos con referencias verificadas,
  entrypoint, config SIN valores y roles/tenancy declarativos; la ejecución
  aislada y la multi-tenancy REAL quedan para M14/fases posteriores.
- **`framework`**: composición verificada de componentes registrados + módulos.

Re-ejecutar cualquier ejemplo es seguro: upserts `id@version` con reutilización
por huella y conflicto fail-closed (409) ante contenido distinto.
