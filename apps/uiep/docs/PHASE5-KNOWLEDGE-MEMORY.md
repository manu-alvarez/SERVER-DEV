# Fase 5 — Knowledge & Memory: MVP vertical con trazabilidad

Estado: implementado y desplegado. **101/101 tests** (+9 de knowledge) · Secret Scan verde ·
**Criterio de éxito cumplido en producción** (ver evidencia). Sin dependencias nuevas, sin
infraestructura pesada, sin servicios de pago.

## Criterio de éxito (definido por producto, verificado en producción)

> Crear una fuente documental desde la consola, procesarla, indexarla, consultarla y
> ejecutar un agente que utilice información recuperada de esa fuente, con referencias
> verificables.

**Evidencia real** (https://uiep.manuelalvarez.dev, contenedor de producción):

```
K2 create_source  → 201 kn-mvwe3u01-d5hu5o (pending)
K3 ingest         → ingested, 3 chunks, dims=768  (nomic-embed-text REAL del VPS)
K4 re-ingesta     → skipped=true                  (idempotencia por hash)
K5 query          → top hit score 0.8186, chunk "DATO-UNICO: …F5-7731-VERDE…"
K7 bind           → demo-kb-fase5 ← [kn-mvwe3u01-d5hu5o]
K9 turno async    → 202 run-778ec82c0387
K10 run final     → completed, 30.4 s, 1 iteración
K11 retrievals    → [{sourceId: kn-mvwe3u01-d5hu5o, chunkIdx: 1, score: 0.8095}, …]
K12 respuesta     → "El código de verificación de la fase 5 es F5-7731-VERDE [1]."
K13 criterio      → CUMPLIDO (dato único + cita + trazabilidad en el run)
```

El dato `F5-7731-VERDE` SOLO existe en la fuente documental: la respuesta del modelo
procede del conocimiento recuperado, con cita [1] y registro de retrievals en el run.

## Decisiones arquitectónicas fijadas (según producto)

1. **Knowledge ≠ Memory**. Knowledge = fuentes documentales externas (alta explícita,
   ingesta, permisos). Memory = interacciones/estado de los agentes (transcripciones de
   sesión del runtime; persistente por diseño). No comparten superficie de datos ni API.
2. **Aislamiento por agente, deny-by-default**: un agente SOLO recupera de las fuentes
   en su binding (`knowledge/bindings.json`). Sin binding → sin acceso (no hay
   recuperación global para agentes). La consulta libre es exclusiva del operador
   (consola).
3. **Trazabilidad respuesta→fuente**: cada turno registra `result.retrievals`
   (sourceId, título, ref, chunkIdx, score) y el contexto inyectado lleva referencias
   [n] que el modelo cita. El RunDialog las muestra.
4. **Adaptadores sustituibles**: `embedding.service` es el ÚNICO punto que conoce el
   proveedor (Ollama `/api/embed`, `UIEP_EMBEDDING_MODEL`, default
   `nomic-embed-text:latest` 768 dims — ya presente en el VPS). Cambiar de proveedor de
   embeddings o motor vectorial no toca ingestion/retrieval/runtime.
5. **Vector Index MVP**: JSON junto al chunk + coseno bruto en proceso (módulo
   `knowledge-store`). Presupuesto: KNOWLEDGE_MAX_TOTAL_CHUNKS=3000 × 768 dims ≈ 9 MB
   RAM (VPS: 6.8 GiB disponibles, verificado). El swap a SQLite/vec (Fase 4.1) o motor
   dedicado solo toca este módulo.
6. **Contrato intacto**: la activación usa el campo `spec.memory {enabled, strategy:
   'semantic'}` que el AgentSpec v1 YA declaraba — cero cambios de esquema. Las
   autorizaciones agente→fuentes viven FUERA del contrato (registro propio), igual que
   los permisos de tools.
7. **Degradación honesta**: un fallo del subsistema de conocimiento NO bloquea el turno
   — el run continúa sin contexto inyectado y anota `knowledge_retrieval_failed` en
   `errors`. Nunca se simula conocimiento.
8. **Sin secretos en el navegador**: toda la superficie pasa por la consola BFF
   (cookie+CSRF) o por Bearer token (Knowledge API). El endpoint de embeddings viaja
   por referencia (`env:OLLAMA_BASE_URL`).
9. **Backup/restore**: el directorio `knowledge/` vive bajo `DATA_DIR` → cubierto por
   el backup diario de Fase 4.2 (verificado: 7 ficheros knowledge en el tar).

## Pipeline (ingestion.service)

Extracción (texto persistido en creación, o URL con fetch acotado — timeout 15 s,
máx. 500 KB, HTML→texto mínimo sin dependencias) → normalización (whitespace) →
fragmentación por párrafos (KNOWLEDGE_MAX_CHUNK_CHARS=1200, solape 150, máx.
200 chunks/fuente) → embeddings batch reales → persistencia con hash + offset.
Estados: pending → ingesting → ingested | failed (con error explícito). Idempotente
por hash del contenido normalizado.

## Superficie API

**Protegida (Bearer UIEP_RUNTIME_TOKEN)** — simétrica al runtime:
`POST /api/knowledge/sources` · `POST /api/knowledge/sources/:id/ingest` ·
`GET /api/knowledge/sources[/:id]` · `DELETE /api/knowledge/sources/:id` ·
`POST /api/knowledge/query` · `GET/PUT /api/knowledge/bindings[/:agentSpecId]`

**Consola (cookie+CSRF)** — delegación directa, misma forma bajo
`/api/console/knowledge/*`.

## UI (Control Center)

- Nueva página **Conocimiento**: alta (texto/URL), ingesta con estado real
  (`INGESTED · 3 fragmentos · 768 dims`), borrado en cascada, consulta semántica con
  referencias ([n], título, fragmento, similitud) y chips de autorización por agente
  (click = toggle binding).
- **Agentes**: sección "Memoria (Knowledge & Memory)" en el editor (switch +
  estrategia `semantic`) — escribe `spec.memory` del contrato.
- **RunDialog**: bloque "Conocimiento inyectado" con las referencias [n] del turno.

## Memory Manager (alcance 5.1, no en este MVP)

La memoria de sesión ya existe (transcripciones persistentes del runtime, Fase 3).
La memoria de AGENTE persistente (notas/hechos derivados de interacciones, con
políticas de retención y actualización) queda para 5.1 sobre las MISMAS bases
(store separado + inyección en Context Builder + UI en la ficha del agente).

## Tests (+9, `knowledge-app.test.ts`)

Bearer 401 anónimo · alta 201 pending · ingesta real (mock de embeddings 4 dims
deterministas) con dims/chunks · reingesta idempotente · consulta con fragmento
trazable · exclusión de fuente ortogonal (umbral) · bindings deny-by-default + set +
lectura · runtime con inyección (round-trip chunk→contexto→modelo→respuesta con el
dato) · runtime sin memoria (sin inyección, sin retrievals) · delegación de consola +
borrado en cascada limpia bindings.
