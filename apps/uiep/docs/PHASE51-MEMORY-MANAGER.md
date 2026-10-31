# Fase 5.1 — Memory Manager + SSRF + fiabilidad de citas

Estado: implementado y desplegado. **110/110 tests** (+9) · Secret Scan verde · evidencia
de producción real (SSRF, memoria escrita y recuperada entre sesiones, citas validadas).
Sin dependencias nuevas ni servicios de pago.

## Requisitos de producto (decisión) y cómo se cumplen

**El modelo NUNCA escribe libremente en memoria persistente.** La escritura es una
herramienta CERRADA (`memory-write`, ToolSpec sembrada, adapter con contexto) que exige:
1. Declaración explícita en `spec.tools[]` (deny-by-default del runtime, igual que las
   tools de conocimiento).
2. Permiso `memory:write` otorgado.
3. `spec.memory.enabled = true` en el agente.
4. Políticas DETERMINISTAS del memory-store (decide la política, no el modelo):
   contenido 3–1000 chars · **deduplicación por hash** (idempotente, sin duplicados) ·
   **TTL** (agente 30 d, sesión 7 d — env `MEMORY_AGENT_TTL_DAYS` /
   `MEMORY_SESSION_TTL_DAYS`) · **cuota** `MEMORY_MAX_ACTIVE_PER_AGENT` (50) ·
   **embedding en la escritura** (sin vector no se persiste memoria de agente — jamás
   se simula).

## Separación Knowledge / Memory (por diseño)

| | Knowledge (Fase 5) | Memory (Fase 5.1) |
|---|---|---|
| Origen | Documentos EXTERNOS dados de alta por el operador | Derivado de INTERACCIONES (turnos del runtime) |
| Escritura | Consola / API (humano o operador) | Tool cerrada `memory-write` + políticas |
| Store | `knowledge/` (sources, chunks+vectores, bindings) | `memory/memories.json` |
| Recuperación | Semántica (coseno) sobre fuentes AUTORIZADAS | Semántica (agente) / recencia (sesión) |
| Trazabilidad | sourceId/título/ref/chunkIdx/score | agentSpecId, sessionId, executionId, input, createdAt, expiresAt |

Ambos comparten SOLO el embedding-service (adaptador sustituible) y el patrón de
persistencia atómica. Cada recuerdo lleva su origen completo (agente, sesión,
ejecución, entrada que lo motivó).

## Inyección de contexto (runtime)

Con `spec.memory.enabled`:
- **Memoria de agente**: top-K por similitud coseno con la entrada del turno
  (`MEMORY_RETRIEVAL_TOPK`=3, umbral 0.30) → bloque `[Memoria del agente]` con refs [M1]…
- **Memoria de sesión**: notas de ESTA conversación por recencia (máx. 5) → `[S1]…`.
- Degradación honesta: fallo de embeddings → recuperación por recencia (explícita); fallo
  del subsistema → nota en `errors`, el turno continúa. Nunca bloquea, nunca simula.

## SSRF en la ingesta por URL (revisión específica)

Nuevo `ssrf-guard.service` aplicado a TODA ingesta URL:
- Solo `http`/`https` (protocolo validado; `file:`, `ftp:` → bloqueados).
- **Resolución DNS real**: TODAS las direcciones (A+AAAA) deben ser públicas — bloquea
  `localhost`, loopback (127/8), privadas (10/8, 172.16/12 — incluye el bridge docker
  172.20/16 y con él Ollama/Traefik/uiep-backend internos, 192.168/16), link-local y
  metadatos de nube (169.254/16), multicast/reservadas, `::1`, unique-local y
  link-local v6, hostnames `.local`/`.internal`/`.localhost`.
- **Redirecciones resueltas MANUALMENTE** (fetch `redirect: 'manual'`, máx. 3 saltos)
  re-validando DNS/IP en CADA salto — un redirect hacia interno es bloqueado.
- Content-type permitido (texto/HTML/JSON); límites de tamaño (500 KB) y tiempo (15 s).

**Evidencia de producción** (contenedor real, red docker del VPS):

```
http://172.20.0.1:11434/api/tags  (gateway docker → Ollama) → 422 BLOQUEADA
http://localhost:4000/api/health  (el propio backend)        → 422 BLOQUEADA
http://169.254.169.254/…          (metadatos de nube)        → 422 BLOQUEADA
https://example.com               (pública)                  → 200 ingested 1 chunk, 768 dims
```

## Fiabilidad de las citas (sin modelo adicional)

Se mantienen DIFERENCIADOS en el run record:
- **Fragmentos recuperados** (`result.retrievals`) — lo que el Context Builder inyectó.
- **Referencias disponibles** para el modelo (la numeración [n] del bloque inyectado).
- **Citas emitidas** (`result.citations`) — referencias [n] que el modelo escribió
  realmente en su respuesta (regex determinista).
- **Correspondencia**: cada cita se valida contra `retrievals[n-1]` → `verified:
  true/false` + sourceId/chunkIdx/score. Una cita SIN respaldo se marca
  `verified:false` (visible en el RunDialog como «SIN respaldo»).

**Evidencia de producción** (agente demo-kb-fase5, qwen3.5:4b real):

```
retrievals: [{chunk 1, score 0.7935}, {chunk 0, 0.7704}, {chunk 2, 0.6281}]
citations:  [{ref 1, verified: TRUE, sourceId: kn-mvwe3u01-d5hu5o, chunkIdx 1, score 0.7935}]
respuesta:  "El código de verificación de la fase 5 es F5-7731-VERDE [1]."
```

Y el caso NEGATIVO (denegación honesta): preguntar a un agente SIN fuentes vinculadas →
sin retrievals, sin citas, y el modelo respondió que no tiene esa información.

## Evidencia de memoria (producción, qwen3.5:4b real)

```
Sesión 1: "Memoriza esto: la clave de la sala del servidor X-42 es 8899."
  → el modelo llamó memory-write → {ok:true, memoryId: mem-mvwetfxd-10yc26,
     kind: agent, TTL hasta 2026-11-30 (30 días)}
Sesión 2 (NUEVA sesión, mismo agente):
  "¿Cuál es la clave de la sala del servidor X-42?"
  → "La clave de la sala del servidor X-42 es 8899."
  (recuperada por similitud con embeddings reales; sobrevive a la sesión)
```

## Consola / UI

- Nueva página **Memoria**: listado con filtros (agente/contenido/sesión), estado
  (activo/caducado/borrado), origen trazable (executionId, sesión), TTL visible y
  eliminación inmediata del operador.
- **RunDialog**: bloque "Citas emitidas" con verificación (verificada / SIN respaldo).
- Backup de 4.2 ampliado automáticamente: el tar incluye `memory/` (verificado: 51
  ficheros).

## Tests (+9, `memory-manager.test.ts`)

SSRF: lista de bloqueo completa (localhost, 127.0.0.1, gateway docker, 10/8, 192.168/16,
metadatos, file:, ftp:, ::1, .local) + fe80::1 sin DNS. Memoria: `memory_disabled`,
escritura con vector + deduplicación idempotente, contenido inválido, semántica de
borrado (segunda eliminación → false). Runtime: round-trip de inyección de memoria
(memoria→contexto→modelo→respuesta), ciclo completo modelo→política→persistencia con la
tool viva, rechazo `memory_write_memory_disabled` con la tool declarada pero memoria
desactivada. Citas: validación unitaria (citada/existente/inexistente).

## Herramienta nueva sembrada

`memory-write` v1.0.0 (adapter `memory-write`, permiso `memory:write`) — ToolSpec v0.3.1
(extensión ADITIVA del enum de adaptadores; compatible hacia atrás con clock/
runtime-info).
