# CIERRE UIEP 1.0 — auditoría de estado y trazabilidad de evolución (Misión 05)

## 0. Corrección de contexto importante

El encargo de esta misión parte del estado "Fases 0–4.2, 92/92 tests" y pide
ESPECIFICAR la Fase 5 (Knowledge/Memory). **Esa especificación ya se implementó,
desplegó y verificó con evidencia de producción**: Fase 5 (Knowledge/RAG MVP),
5.1 (Memory Manager + SSRF + citas), 5.2 (RAG evaluation gate) — y después las
Fases 6 (Workflows), 7 (Integrations/MCP/webhooks), 8 (Operations/Governance) y 9
(Studio). El estado real: **137/137 tests**, tag `uiep-1.0.0` (5c8631d) y
`uiep-1.0.1` (44431f5 — mejora de precisión RAG aprobada y desplegada), imagen de
producción `0286002…` (= `:latest` = `44431f5`).

Este documento AUDITA ese estado real contra la estructura de especificación pedida
(12 puntos) y registra las brechas que quedan para una evolución futura (1.1).

## 1. Auditoría del estado actual (ejecutada en esta misión salvo indicación)

| Punto | Estado | Evidencia | Origen |
|---|---|---|---|
| Commit/tag | `uiep-1.0.0`=5c8631d · `uiep-1.0.1`=44431f5 · main `cf6da79+` | git tag -l | Misión 05 |
| Imagen | prod `0286002…` = `:latest` = `:1.0.0`→(congelada 4ea095d6) — **prod ≠ tag 1.0.0**: prod incluye la mejora RAG 0.70 aprobada; el tag 1.0.0 queda intacto como referencia del freeze | docker inspect/images | Misión 05 |
| Contenedor | Up, `unless-stopped`, volumen `infrastructure_uiep-backend-data` intacto | docker inspect | Misión 05 |
| Suite | 137/137 (+GATE RAG integrado) | última ejecución | heredada (44431f5) |
| Secret Scan | verde (todos los pushes) | gh run list | heredada |
| RAG gate | PASSED (mock 1.0/1.0/1.0 · real 1.0/1.0/1.0 tras el umbral 0.70) | informe del barrido | Misión de mejora |
| Backups | diario 04:17 + retención 14d + **copia externa iCloud** (pull script) | backup log + backups-local | heredada |
| Restauración | verificada en aislado (18 agentes/1 perfil/4 tools/26 sesiones/30 runs) | Misión 1.0-cierre | heredada |
| **Cifrado de copias** | **PENDIENTE** — las copias (VPS tar + iCloud) NO están cifradas por nosotros; iCloud cifra en tránsito y en reposo (Apple), pero no hay cifrado propio del bundle | — | **brecha documentada** |
| Credenciales | consola rotada (401 verificado de la anterior) · runtime token solo en .env · integraciones por referencia | Misión 4.2 | heredada |
| Auth/rate-limit | cookie HMAC HttpOnly + CSRF + login limiter 5/15min + backpressure global | Fases 4/8 | heredada |
| Logs/auditoría | JSONL correlacionado sin secretos + métricas por plano | Fase 8 | heredada |
| Docs instalación/recuperación | README + RUNBOOK + LIMITS-ADR | Misión estabilización | heredada |
| Portabilidad | bundle export/import verificado entre instalaciones | Misión 9 | heredada |

## 2. La especificación pedida (12 puntos) vs lo implementado

| # | Punto pedido | Estado real (fase) |
|---|---|---|
| 1 | Arquitectura propuesta | Implementada y documentada (PHASE5-*): knowledge-store + ingestion + embedding + retrieval + memory-store + context-builder en el runtime + APIs |
| 2 | Componentes nuevos/reutilizados | Nuevos: 5 servicios + 3 rutas; reutilizados: spec-registry, gateway, runtime, backups |
| 3 | Modelo de datos | JSON atómico (sources/chunks/bindings/memories) — SQLite diferido |
| 4 | Flujos ingesta/recuperación | Implementados e idempotentes (hash) |
| 5 | API y UI | /api/knowledge + /api/console/knowledge + páginas Conocimiento/Memoria |
| 6 | Embeddings e índice | nomic-embed-text (768d) + coseno bruto; adaptadores sustituibles |
| 7 | Seguridad/permisos | Bearer + cookie/CSRF + deny-by-default por agente + SSRF guard |
| 8 | Pruebas funcionales/rendimiento/seguridad | 137/137 incluye +, rendimiento = BASELINE-1.0, seguridad = tests SSRF/secretos |
| 9 | Criterios de aceptación | Cumplidos con evidencia (Misión criterio de éxito) |
| 10 | Plan por hitos | Ejecutado (5 → 5.1 → 5.2) |
| 11 | Consumo RAM/CPU/almacenamiento | Medido (BASELINE-1.0): container ~100-150MB; knowledge ~9MB máx |
| 12 | Riesgos y rollback | LIMITS-ADR + anclas + backups externos |

**Conclusión**: la Fase 5 no es un pendiente — es parte del 1.0 auditado. Las brechas
reales para una evolución futura (1.1): persistencia de métricas agregadas, cifrado de
copias, sesiones MCP, precisión RAG con corpus real de uso, ámbito de idempotencia por
workflow, multiusuario.

## 3. Limitaciones conocidas (sin cambiar)

- Métricas en proceso (se pierden al reiniciar; la auditoría JSONL persiste eventos).
- Swap/protección OMM en host compartido con 25 contenedores.
- La copia externa depende de que el Mac/iCloud del propietario esté operativo.
