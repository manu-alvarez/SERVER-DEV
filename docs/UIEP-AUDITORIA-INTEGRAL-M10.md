# UIEP — AUDITORÍA INTEGRAL DE PLATAFORMA (Misión 10)

**Fecha**: 01-nov-2026 · **Alcance**: repositorio SERVER-DEV completo + instalación real en VPS (84.247.186.126)
**Naturaleza**: auditoría de solo lectura. **No se ha modificado código ni desplegado nada.**
**Objetivo**: establecer la realidad técnica de UIEP como base para el plan hacia **Universal Intelligent Engineering Platform**.

---

## 0. Resumen ejecutivo

1. **El núcleo de ejecución de UIEP está completo, probado y verificado en producción**: runtime de agentes, model gateway, tools deny-by-default, knowledge/RAG con gate de calidad, memoria con políticas, motor de workflows con cancelación/reanudación, MCP server+cliente, seguridad (HMAC+CSRF, Bearer timing-safe, SSRF guard, auditoría JSONL sanitizada), idempotencia y backpressure. 137/137 tests.
2. **Existe ya un embrión de motor de generación**: el sistema de **plantillas/blueprints** (`backend/templates/*.json` + `installTemplate` con validación zod, instalación de specs múltiples + knowledge bindeado, idempotencia y auditoría). Dos plantillas reales en producción (agente-documentado, workflow-investigación, instaladas ×4). Es la semilla del futuro Engineering Engine — pero su loader no valida esquema y sus rutas HTTP no tienen tests.
3. **El frontend es 100 % real** (cero maquetas): 13 páginas, CRUD genuino en agentes/knowledge/workflows/proyecto/integraciones. Deuda concreta: `Project.tsx` bypassa `API_BASE` en 5 fetch, drawer móvil no se cierra al navegar, accesibilidad de teclado mejorable.
4. **Para llegar a plataforma universal falta exactamente lo que el propietario identificó**: UES, registro universal de artefactos, Engineering Engine (planificación→generación→ensamblado), Quality/Deployment Engine y aislamiento de generación. Todo lo demás ya existe y es reutilizable.
5. **Código eliminable identificado con precisión**: 6 de 11 paquetes workspace internos sin consumidor, catálogos legacy demo sin auth ni validación, 3 implementaciones duplicadas del bearer guard, exports y funciones muertas en frontend y backend.

---

## 1. Método y fuentes de evidencia

| Fuente | Qué aporta |
|---|---|
| Código backend (`apps/uiep/backend/src`) | 77 endpoints, 24 servicios, 11 paquetes workspace, schemas zod |
| Código frontend (`apps/uiep/apps/web/src`) | 13 páginas, 43 funciones API, store, accesibilidad |
| Tests (`src/tests/`, 22 ficheros) | cobertura real fichero a fichero |
| **Producción** (VPS, contenedor `uiep-backend`) | volumen `/app/data` inspeccionado: 28 specs (18 Agent, 3 Workflow, 4 Tool, 2 Integration, 1 ModelProfile), 6 registros de ejecución de workflow, 4 fuentes de conocimiento, 1 registro de memoria, plantillas embebidas en imagen (`/app/templates/`), auditoría JSONL con 8 tipos de evento (15 login.ok, 1 login.failed, 4 template.install, 2 knowledge.source.delete, 2+2 agent.run, 1 integration.call[.replayed]) |
| Monorepo + infraestructura | 26 apps, 11 servicios compose (+Traefik, +LiteLLM), proxy 933 líneas, backups |

Cada afirmación de este documento es verificable por fichero:línea o por comando sobre el VPS.

---

## 2. Semántica de versionado (aclaración solicitada)

El propietario observó que `BUILD-INFO.json` apunta a `e773d08` y el tag `uiep-1.1.0` a `b4f12a1`. **Es correcto y la semántica queda definida así** (registrada también en `apps/uiep/README.md`):

| Referencia | Apunta a | Significado |
|---|---|---|
| `BUILD-INFO.json → sourceCommit` | `e773d08` | El commit que **produjo el bundle servido** (`www/app/uiep`). El commit de docs `b4f12a1` no regenera el bundle, por eso no se referencia. |
| `git tag uiep-1.1.0` | `b4f12a1` | El **estado final de `main` publicado** (incluye la documentación de cierre y el propio BUILD-INFO). |

**Regla para el versionado futuro** (a implementar en M11+ dentro del Registry): `BUILD-INFO.json` SIEMPRE apunta al commit productor del artefacto; el tag de release señala el commit de publicación. Cuando el artefacto y la publicación coinciden en el mismo commit, ambos apuntan igual. Campo sugerido para añadir entonces: `"releaseTag": "uiep-1.1.0"` en BUILD-INFO (no se toca ahora: misión de solo lectura).

---

## 3. Mapa real vs. los 8 subsistemas objetivo

| Subsistema propuesto | Realidad hoy |
|---|---|
| 1. Core Platform | **Existe** como backend Express único (`src/app.ts`): auth consola + tokens runtime + hooks. Sin usuarios ni multi-tenancy (1 operador). |
| 2. Agent Engine | **Completo** (runtime, sesiones, runs, approval, sweep) + registro de specs. |
| 3. Automation Engine | **Completo** en ejecución (workflows, tools, MCP server/cliente, integraciones con circuit breaker). Falta generación. |
| 4. Knowledge Engine | **Completo** en ejecución (ingesta SSRF-guard, embeddings, retrieval umbral 0.7, bindings, memoria). Evaluación solo como gate de CI, no runtime. |
| 5. **Engineering Engine** | **Embrión**: pipeline `/api/generate` (design-engine → AgentSpec, 28 specs generados) + **sistema de plantillas** (`installTemplate`). Sin planificación, sin ensamblado, sin catálogo de tipos. |
| 6. Quality Engine | **Parcial**: gate RAG determinista (solo CI), golden tests, evaluación en AgentSpec (`spec.evaluation`, campo sin explotar en runtime). |
| 7. Deployment Engine | **No existe** como capacidad interna. Hoy el "despliegue" es el runbook manual del repo (verificado y fiable, pero humano). |
| 8. Registry & Lifecycle | **Parcial**: spec-registry versionado `id@version` (persistencia atómica, listado de versiones) + auditoría + export/import. Sin dependencias entre artefactos, sin catálogo universal, sin ciclo de vida completo. |

---

## 4. Catálogo de APIs (77 endpoints)

Resumen por grupo (detalle completo en el anexo del informe de exploración; autenticación y tests verificados por código):

| Grupo (fichero) | Endpoints | Tests HTTP | Evidencia producción |
|---|---|---|---|
| Salud (`health.ts`) | 1 | ✅ | — |
| Generación (`generate.ts`) | 1 (`POST /api/generate`) | ✅ 11 tests | 28 specs generados |
| Specs (`specs.ts`) | 3 | ✅ | 28 specs en volumen |
| Model gateway (`model-gateway.ts`) | 5 | ✅ 10 | perfil Ollama activo |
| Runtime (`agent-runtime.ts`) | 4 | ✅ 13 | sesiones/runs reales |
| Knowledge (`knowledge.ts`) | 8 | ✅ 9 | 4 fuentes, bindings |
| Workflows (`workflows.ts`) | 8 | ⚠️ motor sí, HTTP no | 6 ejecuciones |
| MCP server (`mcp-server.ts`) | 1 (JSON-RPC) | ✅ round-trip | expuesto `clock,runtime-info` |
| Hooks (`hooks.ts`) | 1 | ❌ **0 tests** | sin eventos de auditoría propios |
| Legacy demo (`templates.ts`, `mcp.ts`) | 3 | ❌ (GET sí) | in-memory, sin uso real |
| **Consola BFF (`console.ts`)** | **39** | ✅ 14 (auth/sesiones/runs/overview) + huecos ⚠️ | todo el Control Center |
| — console workflows (7 rutas) | | ❌ sin tests HTTP | 6 workflow-runs reales |
| — console templates/project (4) | | ❌ sin tests HTTP | 4 template.install |
| — console integrations (4) | | ✅ indirecto | 2 integraciones |
| — console agents versions/clone (2) | | ❌ **0 tests ni servicio probado** | sin uso |
| Observabilidad (`observability.ts`) | 1 | ⚠️ servicio sí, ruta no | fix M09 verificado |

---

## 5. Contratos y modelos de datos reutilizables

**Versionados con zod y mecanismo de versión explícito** (`SUPPORTED_SPEC_VERSIONS = ['uiep.io/v1']`, `packages/agent-spec/src/validate.ts:12`):

| Contrato | Uso | Reutilizable para UES |
|---|---|---|
| **AgentSpec v1** (`agent.schema.ts:21`) | 18 en producción | ✅ directo — ya tiene identity, model, instructions, tools, memory, security, **evaluation** y versionado SemVer por instancia |
| **WorkflowSpec v1** (`workflow.schema.ts:68`, validación estructural DAG) | 3 en producción | ✅ directo |
| **ToolSpec v1** (enum cerrado de adapters) | 4 | ✅ directo |
| **ModelProfile v1** (secretos por referencia) | 1 | ✅ directo |
| **IntegrationSpec v1** | 2 | ✅ directo |
| Plantillas (blueprints JSON) | 2 en imagen | ⚠️ **sin schema propio** — candidato a primer esquema UES de "composite artifact" |
| Knowledge / Memory / Runs | vivos | ⚠️ sin versionado de documento (aceptable: son datos, no specs) |

Base de persistencia ya universal: `spec-registry.service.ts` guarda `id@version` con escritura atómica (tmp+rename), selección SemVer de última versión y saneo anti path-traversal. **Es el núcleo del futuro Registry** — le faltan dependencias entre artefactos y metadatos de procedencia (modelo, generador, evidencias).

---

## 6. El sistema de plantillas — embrión del Engineering Engine ⭐

Respuesta a «¿qué generadores existen ya?»: **uno**, con dos niveles:

1. **Pipeline de generación (`/api/generate` + `@uiep/design-engine`)**: convierte requisitos → AgentSpec (contrato `PipelineResult` con golden test de repetibilidad). Genera specs; **no genera código**. 11 tests. 28 artefactos generados en producción.
2. **Plantillas instalables (`backend/templates/` + `project.service.installTemplate`)**: blueprints JSON que generan **múltiples artefactos compuestos y sus dependencias**: p. ej. `workflow-investigacion.json` instala 2 AgentSpecs + 1 WorkflowSpec de 4 nodos (agent→agent→condition→agent) + fuente de conocimiento + bindings. Validación zod al instalar, idempotencia, evento `template.install`. **Este mecanismo de composición es exactamente el patrón que el propietario describe en el §3 de su visión** (un proyecto = varios subsistemas integrados).

Lo que NO existe aún: planificación por IA, generación de código/esquemas de infraestructura, resolución de dependencias entre artefactos, catálogo de tipos de artefacto.

---

## 7. Clasificación COMPLETO / PARCIAL / PENDIENTE / PRESCINDIBLE

Criterio: **COMPLETO** = implementado + probado + verificado en producción. **PARCIAL** = implementado sin validación suficiente o incompleto. **PENDIENTE** = necesario y no implementado. **PRESCINDIBLE** = sin valor o duplicado.

### 7a. Por familia de ingeniería (catálogo del propietario)

**A. Agent Engineering**
| Artefacto | Clasificación | Base |
|---|---|---|
| Agent | **COMPLETO** | runtime + specs + 18 en prod |
| Multi-Agent System | **PARCIAL** | workflows coordinan agentes (tpl-wf-investigación); no hay identidad/delegación multiagente como spec propia |
| Agent Framework | **PARCIAL** | paquetes `@uiep/*` internos + runtime reutilizable; sin empaquetado para terceros |
| Agentic App | **PARCIAL** | Nikolina demostraría el patrón, pero hoy viven fuera de UIEP sin generador |
| Harness | **PARCIAL** | runtime+aíslamiento+limits existen; no hay harness de evaluación definible por spec |
| Prompt System | **PENDIENTE** | instrucciones inline en AgentSpec; sin plantillas/variables/versiones de prompt |
| Skill Pack | **PENDIENTE** | no existe concepto |

**B. Automation Engineering**
| Artefacto | Clasificación | Base |
|---|---|---|
| Workflow | **COMPLETO** | motor con DAG/condition/parallel/cancel/resume + diseñador visual + 6 ejecuciones |
| Multi-Agent Workflow | **COMPLETO** | nodos agent con herencia de knowledge/memory (test de herencia) |
| Tool Collection | **PARCIAL** | ToolSpecs + seeds; no hay "colecciones" agrupables |
| MCP Server (generación) | **PENDIENTE** | solo sabemos EXPONER las tools internas; no generar servidores MCP nuevos |
| Integration Pack | **PARCIAL** | IntegrationSpec + conector + circuit breaker; sin empaquetado |
| Automation System | **PENDIENTE** | — |

**C. Knowledge Engineering**
| Artefacto | Clasificación | Base |
|---|---|---|
| Knowledge Base | **COMPLETO** | fuentes+ingesta+bindings+consulta (CRUD real) |
| RAG System | **COMPLETO** | pipeline completo + gate Recall/Precision/MRR 1.0 |
| Memory System | **COMPLETO** | políticas dedup/TTL/cuota + tool cerrada |
| Evaluation Dataset | **PARCIAL** | corpus RAG versionado para el gate; no hay datasets por agente |
| Knowledge Pipeline | **PARCIAL** | ingesta URL/texto; falta extracción/transformación avanzada y actualización programada |

**D. Software Engineering**
| Artefacto | Clasificación | Base |
|---|---|---|
| Application / Agentic Application | **PENDIENTE** | no hay generador de aplicaciones |
| API Platform | **PARCIAL** | el propio backend es una API documentada por código; sin generación |
| SaaS | **PENDIENTE** | sin multiusuario/tenancy/facturación |
| Framework | **PENDIENTE** | — |
| Enterprise Architecture | **PENDIENTE** | — |

**E. Quality Engineering**
| Artefacto | Clasificación | Base |
|---|---|---|
| Evaluation (de agentes) | **PARCIAL** | campo `spec.evaluation` existe sin explotar; gate RAG solo CI |
| Benchmark | **PENDIENTE** | golden tests internos, no comparativas |
| Test Harness | **PARCIAL** | 137 tests con fixtures; sin entorno aislado definible por spec |
| Security Assessment | **PARCIAL** | auditoría+sanitización+deny-by-default reales; sin evaluación automática |
| Observability Pack | **PARCIAL** | métricas+auditoría+trazas reales; métricas no persistentes (deuda conocida) |

**F. Systems Engineering**
| Artefacto | Clasificación | Base |
|---|---|---|
| Deployment Architecture | **PARCIAL** | compose + proxy + Traefik reales; no generables |
| Infrastructure Stack | **PARCIAL** | 11 servicios operativos; sin generación/empaquetado |
| CI/CD Pipeline | **PARCIAL** | Secret Scan automático; resto manual (runbook) |
| Enterprise Platform | **PENDIENTE** | — |
| Monitoring System | **PARCIAL** | observabilidad interna + uptime-kuma externo |
| Disaster Recovery Plan | **PARCIAL** | backup diario+externo verificados y restauración probada para UIEP; sin cobertura para otras BD |

### 7b. Plataforma (los 8 subsistemas)

| Subsistema | Clasificación |
|---|---|
| Core Platform | **COMPLETO** para 1 operador (multiusuario PENDIENTE) |
| Agent Engine | **COMPLETO** |
| Automation Engine | **COMPLETO** (ejecución) |
| Knowledge Engine | **COMPLETO** (ejecución) |
| Engineering Engine | **PARCIAL** (embrión: pipeline + plantillas) |
| Quality Engine | **PARCIAL** |
| Deployment Engine | **PENDIENTE** |
| Registry & Lifecycle | **PARCIAL** |
| **UES** | **PENDIENTE** |
| Aislamiento de generación (sandbox) | **PENDIENTE** |

---

## 8. Matriz de trazabilidad (capacidad → código → API → UI → tests → producción)

| Capacidad | Código | API | UI | Tests | Evidencia prod |
|---|---|---|---|---|---|
| Crear/editar agente | `spec-registry.service` | `POST /api/specs` + console | Agents.tsx (editor completo) | ✅ | 18 specs |
| Generar agente por IA | `pipeline.service` + `@uiep/design-engine` | `POST /api/generate` | — (sin UI) | ✅ 11 | 28 specs |
| Conversar (runtime) | `agent-runtime.service` | `/api/runtime/*` + console | Playground.tsx | ✅ 13 | sesiones+runs |
| Tools con permisos | `tool-registry.service` | `/api/console/tools` | Tools.tsx (lectura) | ✅ | 4 ToolSpecs |
| Knowledge/RAG | ingestion+retrieval+knowledge-store | `/api/knowledge/*` + console | Knowledge.tsx (CRUD) | ✅ 9 + GATE | 4 fuentes |
| Memoria | memory-store + tool `memory-write` | `/api/console/memory` | Memory.tsx | ✅ 9 | 1 registro |
| Modelos | `model-gateway.service` | `/api/profiles*` | Models.tsx (diagnóstico) | ✅ 10 | perfil Ollama |
| Workflows | `workflow-runtime.service` | `/api/workflows*` + console | Workflows.tsx + Designer | ⚠️ motor sí / HTTP no | 6 ejecuciones |
| MCP expuesto | `routes/mcp-server.ts` | `POST /api/mcp-server` | — (externo) | ✅ round-trip | configurado |
| Integraciones | `integration.service` + `mcp-client` | console | Integrations.tsx | ✅ 7 | 2 activas |
| Plantillas | `project.service.installTemplate` + loader | console templates | Project.tsx | ⚠️ servicio sí / HTTP no | 4 instalaciones |
| Export/import proyecto | `project.service` | console project | Project.tsx | ⚠️ servicio sí / HTTP no | sin uso registrado |
| Clonar agente | `cloneAgentSpec` | console clone | Project.tsx | ❌ 0 tests | sin uso |
| Webhooks entrantes | `routes/hooks.ts` | `/api/hooks/:id` | — | ❌ 0 tests | sin eventos |
| Auditoría/obs | `observability.service` | console observability | Observability.tsx + Sistema | ⚠️ servicio sí | 8 tipos de evento |
| Idempotencia/backpressure | `reliability.service` | transversal | — | ✅ 4 | semáforos activos |
| Auth consola | `console.ts` guard | auth/* | store+LoginGate | ✅ 16 | 15 login.ok/1 failed |
| Seguridad SSRF | `ssrf-guard.service` | transversal (ingesta) | — | ✅ en memory/knowledge tests | ingesta operativa |

---

## 9. Pruebas que faltan (priorizado)

1. **HTTP de workflows** (8+7 rutas): el motor está probado, la superficie HTTP no.
2. **Hooks** (superficie autenticada completa sin un solo test).
3. **HTTP de templates/project/clone/versions** (el CRUD del futuro Engineering Engine).
4. Observabilidad como ruta (poll 15 s de la UI).
5. Rutas legacy `POST /api/templates` y `/api/mcp` (o eliminarlas — ver §11).
6. Frontend: 0 tests (mínimo viable: navegación + auth + un CRUD feliz-path).

---

## 10. Duplicidades y deuda (con evidencia)

| # | Hallazgo | Evidencia | Riesgo |
|---|---|---|---|
| 1 | Guard Bearer duplicado ×3 | `bearer-guard.ts` vs `agent-runtime.ts:27-41` vs `mcp-server.ts:21-35` | drift de seguridad |
| 2 | 6 paquetes workspace muertos | `auth-system`, `entity-registry`, `memory-system`, `monitoring`, `plugin-system`, `ui` — 0 consumidores | peso/mantenimiento |
| 3 | Catálogos legacy demo sin auth ni validación | `routes/templates.ts:45`, `routes/mcp.ts:16` | superficie abierta |
| 4 | `Project.tsx` bypassa `API_BASE` (5 fetch hardcodeados) | `Project.tsx:41,53,75,91,107` | roto en dev, inconsistente |
| 5 | `GenerateSchema.templateId` aceptado pero ignorado | `schemas.ts:13` vs `pipeline.service.ts:74-87` | contrato engañoso |
| 6 | `cloneAgentSpec`/versions sin tests y sin uso | `project.test.ts:14` promete lo que no prueba | — |
| 7 | Drawer móvil no se cierra al navegar | `Layout.tsx:241-248` | UX móvil |
| 8 | Doble `refresh()` de sesión por carga | `Layout.tsx:124,223` | peticiones ×2 |
| 9 | Fallos de API silenciados como "lista vacía" | `catch(() => setX([]))` en 8 páginas | diagnóstico difícil |
| 10 | Métricas en proceso (no persistentes) | deuda conocida del propietario | se pierden al reiniciar |
| 11 | Actores de auditoría `hook`/`mcp` declarados, nunca emitidos | `observability.service.ts:26-28` | trazabilidad incompleta |
| 12 | `proxy_server.js.bak` trackeado en git | `git ls-files` | ruido/riesgo |
| 13 | TypeScript dual 5.x/6.x en el workspace uiep | web `~6.0.2` vs raíz `^5.7.0` | tooling inestable |
| 14 | Sin interceptor global de expiración de sesión (401) | frontend | UX |

---

## 11. Dependencias y código eliminables

- **Paquetes `@uiep/*` muertos (6)**: eliminar del workspace (`auth-system`, `entity-registry`, `memory-system`, `monitoring`, `plugin-system`, `ui`) — el backend ya implementó sus funciones reales (`memory-store`, `observability`). Elimina ~10 % del árbol del monorepo uiep.
- `uuid` → devDependency (0 usos en código de producción; solo tests). Alinear `@types/uuid`.
- Endpoints legacy demo (`routes/templates.ts`, `routes/mcp.ts`) → eliminar o proteger; hoy son push sin validar.
- Frontend: `api.health`, `api.runs` (listado), `api.templates.install` (usar en vez del fetch de Project.tsx), export default de `Agents`, estado `saving` del diseñador; unificar `pretty()` ×3.
- Repo: `proxy_server.js.bak`, builds `packages/ui/out/`, ficheros duplicados iCloud (`* 2.*`, refs rotas) — limpieza git.

---

## 12. Qué falta para Universal Intelligent Engineering Platform

Respuesta directa a la pregunta del propietario, en orden de dependencia:

1. **UES** (especificación universal): extender el mecanismo ya existente (`apiVersion` + zod + `id@version`) a un schema de "proyecto compuesto" con dependencias entre artefactos. Los contratos v1 de Agent/Workflow/Tool/Profile/Integration son el 80 % del camino.
2. **Registry universal**: evolucionar `spec-registry.service` (ya atómico y versionado) con: grafo de dependencias, procedencia (generador, modelo, versión, evidencias) y catálogo de tipos.
3. **Engineering Engine**: generalizar `installTemplate` (hoy determinista) hacia: planificación por IA → plan de artefactos → generación vía pipeline (ya existe) → validación (gates ya existen) → ensamblado. La separación motor-ejecución/motor-generación ya está correctamente separada en el código.
4. **Quality Engine runtime**: convertir el gate RAG (hoy CI) en evaluación ejecutable por spec (`spec.evaluation` ya existe en AgentSpec).
5. **Deployment Engine + sandbox**: generación/validación en contenedores aislados con límites (Docker ya disponible); despliegue como operación autorizada diferenciada — alineado con la restricción del propietario de no dar acceso ilimitado al VPS.
6. **UX de ingeniería** (M15): el asistente guiado de agentes queda como PRIMER generador con UI, no como caso especial.

---

## 13. Respuestas directas a las 10 preguntas

1. **¿Qué módulos existen realmente?** Ver §3: 24 servicios backend + 11 paquetes workspace (6 muertos) + 13 páginas web + infraestructura de 11 contenedores. Sin imports cruzados entre apps del monorepo (cada una es un proyecto independiente; solo UIEP es workspace interno).
2. **¿Qué funcionalidades están implementadas y cuáles son solo interfaces?** No hay ninguna página maqueta; toda la UI consume API real. Interfaces "solo de lectura" por diseño: Tools, Models (sin CRUD de profiles), Observability. La única escritura pendiente de UI es la de ModelProfile.
3. **¿Qué APIs están disponibles?** 77 endpoints (§4) — 46 en un catálogo autenticado real, 39 de consola.
4. **¿Qué partes del backend están terminadas?** Runtime completo, gateway, knowledge, memoria, workflows, MCP, seguridad, idempotencia (§7a). Huecos: hooks sin tests, clones sin tests ni uso, legacy demo.
5. **¿Qué contratos reutilizamos?** Los 5 schemas zod v1 + el mecanismo de versionado + el spec-registry atómico (§5).
6. **¿Qué generadores existen ya?** Pipeline design-engine (AgentSpec, 11 tests, 28 usos reales) y sistema de plantillas compuestas con validación e idempotencia (§6).
7. **¿Qué pruebas faltan?** §9 — HTTP de workflows/templates/project/hooks/clone y un mínimo de tests de frontend.
8. **¿Qué funcionalidades están duplicadas?** §10.1-10.6 (bearer guard ×3, catálogos legacy, fetch duplicado de templates, pretty() ×3, memoria duplicada paquete/servicio).
9. **¿Qué dependencias podemos eliminar?** §11 (uuid a devDeps, 6 paquetes muertos, legacy demo, bak/out, TS dual).
10. **¿Qué falta para plataforma universal?** §12 — UES + Registry + Engineering Engine + Quality/Deployment runtime + sandbox. Nada de eso requiere rehacer lo existente.

---

## 14. Insumo para las Misiones 11–16

| Misión | Lo que la auditoría aporta |
|---|---|
| M11 (UES + Registry) | Partir de `packages/agent-spec` + `spec-registry.service` (no desde cero). Primer tipo compuesto: el blueprint de plantilla (hoy sin schema). |
| M12 (Generadores) | Generalizar `installTemplate` + pipeline; eliminar el catálogo legacy demo para no confundir superficies. |
| M13 (Software/sistemas) | Requiere sandbox (§12.5) antes de generar código ejecutable. |
| M14 (Quality/Deployment) | `spec.evaluation` como puerta runtime; métricas persistentes; despliegue autorizado. |
| M15 (UX) | El asistente guiado de agentes = primer flujo Engineering Engine con UI (Home 1.1 ya enlaza `/agents/new`). |
| M16 (Validación integral) | Criterios del propietario §7: adoptar la regla "no COMPLETO sin implementación + pruebas + evidencia" ya aplicada en esta auditoría. |

**Correcciones menores de documentación ejecutadas en esta misión** (solo docs): nota de semántica de versionado en `apps/uiep/README.md` (§2 de este documento). Ningún cambio de código, ningún despliegue.
