# Fase 5.2 — RAG Evaluation & Quality Gate

Estado: implementado y en CI. **117/117 tests** (+7) · Secret Scan verde · GATE PASSED en
dos modos: **mock determinista** (CI, mide el MECANISMO) y **proveedor REAL** en el VPS
(nomic-embed-text 768 dims, mide CALIDAD semántica). Sin dependencias nuevas, sin
servicios de pago, sin LLM-as-judge.

## Qué añade

Cada cambio en embeddings, fragmentación, recuperación, contexto o citas es ahora
**medible y reproducible** — y las regresiones se detectan automáticamente ANTES de
desplegar (el gate vive en la suite de tests estándar).

| Bloque | Implementación |
|---|---|
| Corpus versionado | `apps/uiep/eval/rag-corpus.json` (v1.0.0): 6 documentos de tema único + 6 preguntas con documento relevante y contenido esperado de la respuesta. Versiona junto al código. |
| Métricas de recuperación | `rag-eval.service`: **Recall@K, Precision@K, MRR** calculados sobre los resultados REALES del índice (embeddings + coseno + umbral) — **independiente del LLM**: nunca se pide al modelo que juzgue su propia calidad. |
| Métricas de citas | Sobre runs del corpus con el modelo de prueba (mock determinista en CI): emitidas / verificadas / **sin respaldo**, con la MISMA validación determinista del runtime. Ratio verificado ≥1 exigido en el gate. |
| Aislamiento | Agente sin bindings → `no_authorized_sources`; desvincular una fuente la saca de la recuperación (y restaurar bindings la devuelve). |
| Privacidad de memoria | Aislamiento entre agentes (la memoria de A nunca llega a B) · recuerdo ELIMINADO excluido de consultas posteriores · **TTL caducado excluido** (probado con TTL 0.86 s real) · notas de sesión acotadas a SU sesión. |
| Regresiones | Parámetros de búsqueda (topK/umbral), fragmentación e índice quedan cubiertos por el gate; el modo real añade la calidad del proveedor de embeddings sobre el mismo corpus. |
| Informe CI | La suite imprime el informe (tabla por pregunta + agregados + veredicto del gate); scripts `eval:rag` (mock) y `eval:rag:real` (proveedor real). |

## Umbrales (env, configurables)

`RAG_EVAL_MIN_RECALL_AT_K`=0.9 · `RAG_EVAL_MIN_MRR`=0.9 ·
`RAG_EVAL_MIN_PRECISION_AT_K`=0.3 · en modo mock además: citas sin respaldo=0 y
respuestas del corpus OK (100%).

## Resultados

**CI (mock, mecanismo)**:

```
Recall@3=1.000 · MRR=1.000 · Precision@3=1.000
Citas: emitidas=6 verificadas=6 sin_respaldo=0 (ratio 1.00)
GATE: PASSED
```

**VPS (proveedor REAL — nomic-embed-text 768 dims, calidad semántica)**:

```
6/6 preguntas rank=1 · Recall@3=1.000 · MRR=1.000 · Precision@3=0.333
GATE: PASSED  (precision 0.33 = 1 relevante entre 3 hits reales ≥ umbral 0.30)
```

**El gate funcionó desde el primer minuto**: la primera ejecución detectó una regresión
REAL (los temas naranja/violeta/gris compartían el bucket de fallback del mock →
MRR 0.806 → gate FAILED) → corregido → MRR 1.0. Ejemplo vivo de detección automática.

## Diseño de la evaluación (decisiones)

1. **Sin LLM-judge como gate**: métricas deterministas de ranking y citas; un judge
   opcional podría añadirse DESPUÉS como complemento informativo.
2. **Dual-mode con el mismo corpus**: mock (CI, determinista, mide el mecanismo) /
   real (VPS, mide la calidad del proveedor de embeddings). Cambiar de proveedor de
   embeddings y re-evaluar = un comando (`eval:rag:real`).
3. **Ingesta idempotente del corpus**: las fuentes del eval se recrean/reutilizan por
   hash y se limpian al terminar (no dejan datos de evaluación en producción).
4. **El gate corre en la suite estándar**: `pnpm --filter uiep-backend test` incluye el
   gate → ningún despliegue sin pasar por él (el flujo de despliegue ya ejecuta los
   tests antes de construir la imagen).

## Criterio de cierre (cumplido)

- Resultados cuantificables: Recall@K / Precision@K / MRR / citas por corpus y por pregunta.
- Umbrales configurables por env.
- Regresiones detectadas automáticamente antes de desplegar (gate en la suite + CI).
- Evaluación independiente del LLM (ranking sobre el índice real).
- Privacidad de memoria verificada (TTL, borrado efectivo, aislamiento, alcance de sesión).
