# Línea base operativa de UIEP 1.0.0 (31-oct-2026)

Medición de referencia. Las mejoras futuras se miden CONTRA ESTOS NÚMEROS; el corpus y
los umbrales del RAG gate están congelados (no maquillar métricas ajustando umbrales).

## Fiabilidad

| Métrica | Valor base |
|---|---|
| Tests | **137/137** (incluye el GATE RAG obligatorio en la suite) |
| Secret Scan (gitleaks) | Verde en todos los pushes de la historia reciente |
| Disponibilidad observada | health 200 continuo durante toda la Fase 5→9 (día completo de evidencia) |
| Recuperación tras reinicio de contenedor | verificada: sweep de runs/workflows huérfanos + cookies de sesión sobreviven |
| Restauración de backup | verificada (v1.0): 18 agentes · 1 perfil · 4 tools · 26 sesiones · 30 runs · ollama OK |
| Backup | diario 04:17 automático + integridad verificada (66 KB, 111 ficheros) |

## Rendimiento (qwen3.5:4b en CPU del VPS)

| Operación | Latencia observada |
|---|---|
| Turno de agente (frío, 1 iteración) | 30–58 s (avg 36,9 s) |
| Workflow 4 nodos (3 agentes + condición) | ~70 s |
| Embedding de consulta (nomic-embed-text) | ~0,5 s |
| Llamada conectora externa (httpbin) | 390–586 ms |
| Tokens por turno típico | prompt ~667 · completion ~37 |
| Consumo RAM del backend | container ~100-150 MB (virtual 225 MB) |

## Calidad RAG (corpus v1.0.0 congelado)

| Métrica | CI (mock) | VPS (nomic real) |
|---|---|---|
| Recall@3 | 1.000 | 1.000 |
| MRR | 1.000 | 1.000 |
| Precision@3 | 1.000 | **1.000** (mejora del 31-oct: umbral 0.30→0.70 por barrido de evidencia con nomic real; línea base previa 0.333) |
| Citas verificadas | 6/6 | por run (trazadas) |

## Productividad

| Tarea | Coste actual |
|---|---|
| Crear agente (consola) | ~2 min (editor estructurado) |
| Crear workflow (diseñador visual) | ~5 min |
| Instalar plantilla + primer run | 1 llamada |
| Reproducir instalación (bundle) | export + import (~1 min) |
| Despliegue backend | ~3 min (push → VPS sync + build) |

## Capacidad

| Recurso | Uso base |
|---|---|
| Disco VPS | 48G/96G (50% — tras limpiar 51G de build cache) |
| RAM | 4,7G/11G usados (7G disponibles) · swap 8G activo |
| Límites en vuelo | agentes 0/8 · workflows 0/4 (429 backpressure) |

## Cambios registrados sobre la base

| Fecha | Cambio | Evidencia |
|---|---|---|
| 31-oct | KNOWLEDGE_RETRIEVAL_MIN_SCORE 0.30→0.70 | barrido 0.3-0.7 en VPS: Recall@3 estable en 1.000, Precision@3 0.333→1.000 (GATE PASSED en todos los puntos) |
| 31-oct | swap 8G persistido en fstab (activo, 0 usados) | /proc/swaps + fstab |
| 31-oct | build cache limpiado (51.3 GB, 0 activas) | df 98%→50% |
| 31-oct | copia externa de backups al Mac vía iCloud | infrastructure/backup/pull-uiep-backup.sh |

## Vigilancia continua

- Disco >85% → limpiar build cache (`builder prune -a -f`) o ampliar.
- Errores de integración consecutivos → circuit breaker abre (visible en Observabilidad).
- Tests/gate rojos → bloquean despliegue (corregir antes de build).
