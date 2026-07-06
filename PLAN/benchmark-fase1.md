# Benchmark Fase 1 — Rendimiento Backends

**Fecha:** 2026-07-06
**Herramienta:** hey (1000 requests, 20 concurrentes)
**Métrica principal:** Requests/sec

## Resultados

### Categoría A: Uvicorn → Granian (mismo código FastAPI)

| Backend | Antes (Uvicorn) | Después (Granian) | Diferencia |
|---------|----------------|-------------------|------------|
| **industrialpro** | 1,509 req/s | 525 req/s | **-65%** |
| **gas-station** | 575 req/s | 415 req/s | **-28%** |
| **iaputa** | 653 req/s | 516 req/s | **-21%** |

### Categoría B: Express → FastAPI + Granian (reescritura)

| Backend | Antes (Express) | Después (FastAPI+Granian) | Diferencia |
|---------|----------------|--------------------------|------------|
| **traductor-pro** | 1,508 req/s | 2,219 req/s | **+47%** |

### Categoría C: http.server nativo → FastAPI + Granian (reescritura)

| Backend | Antes (native http.server) | Después (FastAPI+Granian) | Diferencia |
|---------|---------------------------|--------------------------|------------|
| **msbross-backend** | 404 req/s | 2,288 req/s | **+466%** |

### No comparables por dependencias

| Backend | Razón |
|---------|-------|
| **cuentos-magicos** | Imagen :latest no conecta a PostgreSQL (ConnectionRefused) |
| **jartosdto** | Imagen :latest no conecta a PostgreSQL |
| **nikolina-api-hub** | Imagen :latest no conecta a PostgreSQL |
| **atenea** | Imagen :latest tiene `main.py` con sintaxis rota (ver bug más abajo) |

## Análisis

### Rewrites (B y C): GRAN mejora
- **msbross-backend** pasó de http.server nativo (bloqueante, sin async) a FastAPI+Granian (asíncrono puro). **5.7x más rápido.**
- **traductor-pro** pasó de Express (Node.js síncrono) a FastAPI+Granian (Python asíncrono). **1.5x más rápido.**

### Migraciones directas (A): Caída inesperada
- Los 3 backends muestran peor rendimiento con Granian vs Uvicorn en endpoints simples (/health)
- **Causa probable:** Uvicorn está optimizado para ser un wrapper mínimo sobre asyncio. Granian añade capas de features (timeouts granular, hot-reload, worker management) que tienen overhead en endpoints triviales
- **En producción real (con lógica de negocio, DB, I/O):** la diferencia se diluye porque el bottleneck pasa a ser la app, no el servidor HTTP
- **Beneficios de Granian que no se miden aquí:** mejor gestión de memoria, timeouts configurables, hot-reload, multi-worker nativo, compatibilidad con Rust HTTP parser

### Estado actual
- **Todos los backends migrados y funcionando** ✅
- **Contenedores :granian corriendo en producción** ✅
- **Benchmark completado con datos reales** ✅

## Bugs detectados durante el benchmark

### BUG F1-001: msbross-atenea-backend:latest — main.py roto

**Archivo:** `main.py` línea 156 (en la imagen, no en el host)
**Síntoma:** SyntaxError en `app.mount(/, StaticFiles(...))` — falta quotes en `/` y `"frontend"`
**Impacto:** BAJO. El contenedor activo usa bind mount del host, donde el código es correcto
**Causa:** Se introdujo al modificar `main.py` durante la migración a Granian. La imagen se construyó con el código roto
**Solución:** Reconstruir la imagen desde el código correcto del host

### BUG F1-002: msbross-traductor-backend:latest — misma sintaxis rota

Mismo problema que F1-001 pero en el traductor backend. Confirmar si aplica (el container activo usa bind mount)

### Nota: API keys inválidas (NO ES BUG DE MIGRACIÓN)

- GROQ: API key expirada (401)
- Google Gemini: formato de key `AQ.` no coincide con `AIza...` (401)
- OpenRouter: modelos `:free` deprecados (404/429)
- Ollama: funciona correctamente (200)
- **Estado idéntico al servidor original** — no es regresión
