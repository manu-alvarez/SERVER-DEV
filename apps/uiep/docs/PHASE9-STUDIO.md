# Fase 9 — Agent Engineering Studio & Productization

Estado: implementado y desplegado. **137/137 tests** (+2) · Secret Scan verde ·
**Criterio de éxito cumplido de extremo a extremo con evidencia real** (incluida la
reproducción en OTRA instalación). Dependencia nueva re-introducida por necesidad
demostrada: `@xyflow/react` (canvas del diseñador — MIT, sin servicios externos).

## Criterio de éxito (definido por producto) — VERIFICADO

> Crear un proyecto desde la consola, diseñar visualmente un workflow, asociar agentes
> y herramientas, validarlo, ejecutarlo, inspeccionar sus resultados y exportarlo para
> reproducirlo en otra instalación de UIEP.

Evidencia real:

```
Producción:
  P1/P2  plantilla 'workflow-investigacion' instalada → 3 specs + knowledge (con binding)
  P3/P4  workflow ejecutado (qwen3.5:4b real) → completed
         investigar (RAG) → "…TPL-PROY-777 [2]."
         extraer → "El código del proyecto de ejemplo es TPL-PROY-777."
         hay-dato (condition) → TRUE → informar → informe final con el dato
Export:  bundle de producción → 28 specs + 2 fuentes de conocimiento
Otra instalación (Mac, DATA_DIR limpio = instalación nueva):
  import → 28 specs + 2 knowledge, 0 errores (re-ingesta real de embeddings)
  run del workflow IMPORTADO → completed → "TPL-PROY-777"
  ⇒ REPRODUCIDO EN OTRA INSTALACIÓN
```

## Componentes

| Componente | Qué se entregó |
|---|---|
| **A. Visual Workflow Designer** | Canvas @xyflow/react: nodos agent/condition/parallel con colores por tipo, edges de ramas (then verde/else roja/branch cian), panel de ORDEN de secuencia reordenable, panel de propiedades por tipo (agentSpecId, plantillas de entrada con `{{input}}/{{prev}}/{{nodo}}`, checks, reintentos, ramas), validación en tiempo real (refs rotas marcadas) + validación del CONTRATO al guardar (backend), export/import JSON del workflow, toggle JSON↔canvas. Las posiciones del canvas van en localStorage — el WorkflowSpec sigue siendo funcional puro (portable). |
| **B. Agent Lifecycle** | Historial de versiones por agente (`listSpecVersions` + endpoint), clonado con un click (nuevo id, v1.0.0) — en la página Proyecto. |
| **C. Templates & Blueprints** | Plantillas versionadas EN EL REPO (`apps/uiep/backend/templates/`): specs + knowledge de ejemplo con binding — instalables en una llamada, **idempotentes** (reutilizan la fuente por título — bug detectado en producción: las copias repetidas diluían el topK de recuperación). |
| **D. Developer Experience** | Bundle export/import (la reproducibilidad ES la DX del MVP); documentación de API/operación por fase (docs/). SDK/CLI: fuera del MVP de esta fase (señalados como extensión natural). |
| **E. Platform UX** | Navegación unificada de la consola con las 9 secciones (Dashboard/Agentes/Playground/Conocimiento/Memoria/Workflows/Integraciones/Observabilidad/Proyecto/Modelos/Herramientas). |

## Problemas detectados y corregidos durante la fase (gate funcionando)

1. El contenedor no veía las plantillas (fuera del contexto de build) → movidas a
   `backend/templates/` + `COPY` explícito en el Dockerfile.
2. `then == else` en una condición corrompía el flujo (marcaba como skipped el nodo
   tomado) — detectado ejecutando la PLANTILLA en producción → corregido.
3. La instalación repetida de plantillas creaba copias de knowledge que diluían el
   topK de recuperación (el investigador respondía honestamente que no tenía el dato) →
   reutilización por título (idempotencia de instalación).
4. El bundle web de la fase no llegó al commit (pathspec roto en git add) → detectado
   comparando el hash servido vs el disco → commit + verificación de hash servido.

## Diseño (decisiones)

- El layout del canvas NO es contrato: el WorkflowSpec sigue siendo funcional puro
  (exportable/reproducible); las posiciones viajan aparte (localStorage).
- El bundle de proyecto EXCLUYE la memoria (datos derivados privados de cada
  instalación) — exporta contratos + knowledge (con contenido para re-ingesta real).
- El import es idempotente y VALIDA cada contrato (nada inválido entra).
