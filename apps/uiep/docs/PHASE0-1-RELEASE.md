# Fase 0.1 — Compatibilidad, candidata de producción y rollback

Base: `21f1ed1` · Fecha: 2026-10-30 · **NO desplegada** — pendiente de autorización explícita.

## 1 · Selección de framework (corregida y verificada)

Corrección del registro: `intent.ts` **sí** respetaba `targetFrameworks[0]`; el síntoma del informe
de Fase 0 ("openai-agents pese a langgraph") lo causaba el servicio del backend, cuyo early-return
descartaba el framework cuando `type` venía omitido. Ambos puntos corregidos:

- **Motor** (`design-engine/src/pipeline/intent.ts`): `resolveFramework()` respeta la selección
  explícita, valida contra `FrameworkSchema` (fuente única: entity-schema) y lanza
  `UnsupportedFrameworkError` (exportado) con la lista de soportados — sin fallback silencioso.
  Sin selección explícita → heurística por defecto (`openai-agents`). El framework elegido se
  refleja en `intent.framework`, en el blueprint de factory y en los artefactos `config.json` y
  `README.md` (nuevo).
- **Backend** (`pipeline.service.ts`): mapea `framework` HTTP → motor siempre (con o sin `type`).

Evidencia (21/21 tests en Mac y VPS; contenedor RC):
`framework=langgraph → engine.intent.framework=langgraph` (con y sin `type`), `openai→openai-agents`,
`custom→custom`, `['crewai','n8n']→crewai`, no-soportado → error explícito con lista,
artefactos reflejan el framework elegido.

## 2 · Compatibilidad del frontend publicado (auditado con evidencia)

Consumidores de `/api/generate` en `www/app/`:

| App | Publicada por el proxy | Consumo de /api/generate | Riesgo del cambio |
|---|---|---|---|
| `www/app/uiep` (Next, canvas React Flow) — `uiep.manuelalvarez.dev` y `/app/uiep` | **SÍ** (NEXT_APPS + DOMAIN_APP_MAP) | **Ninguno** — genera 100% client-side | **Cero** |
| `www/app/uiep-web` (MUI + axios `baseURL: http://localhost:4000`) | **NO** (no está en NEXT_APPS ni DOMAIN_APP_MAP) | POST /api/generate (9 campos legacy) | Dormida — no sirve tráfico |

Evidencia en vivo (navegador real contra `https://uiep.manuelalvarez.dev`, hashes idénticos
repo↔VPS de `index.html` y chunk de página): prompt + "⚡ GENERATE ARCHITECTURE" → canvas
renderizado, **0 peticiones de red a ninguna API, 0 errores/avisos de consola**.
El único consumidor real (`uiep-web`) además usaría `http://localhost:4000`, imposible de alcanzar
desde un navegador remoto y bloqueado por el CSP del proxy (`connect-src 'self' https: wss:`).

**Conclusión: el despliegue del motor real no rompe ninguna interfaz publicada.**

Nota para Fase 1: la UI rica (`uiep-web`) necesita, para activarse: baseURL relativa o `/_uiep`,
ajuste de CSP `connect-src`, y rebuild (le falta `axios` en deps; su build está roto de origen).

## 3 · Candidata de producción e imagen anterior

- **Candidata**: `msbrossai-uiep-backend:rc-21f1ed1` (multi-stage, lockfile frozen, 21/21 tests).
- **Contenedor RC verificado** en msbross_net: health 200 · generate 200 (9 campos legacy + engine,
  framework langgraph respetado) · 400 en inválido · **0 errores en logs** · **restart → health 200**
  · eliminado tras la evidencia.
- **Ancla de rollback**: el contenedor productivo `uiep-backend` corre
  `msbrossai-uiep-backend:latest` = `sha256:da561e63ab7c…` (Up 2 días, sin reiniciar).

## 4 · Procedimiento de despliegue (NO ejecutado)

```bash
# 0) Ancla de rollback (conserva la imagen actual bajo tag dedicado)
docker tag msbrossai-uiep-backend:latest msbrossai-uiep-backend:rollback-20261030

# 1) Build + swap controlado
cd /home/ubuntu/MSBrossAI
docker compose -f infrastructure/docker-compose.yml build uiep-backend
docker compose -f infrastructure/docker-compose.yml up -d uiep-backend

# 2) Verificación post-despliegue
curl -s http://127.0.0.1:8080/_uiep/api/health
curl -s -X POST http://127.0.0.1:8080/_uiep/api/generate \
  -H 'content-type: application/json' \
  -d '{"goal":"Analista de datos","framework":"langgraph"}'   # engine.intent.framework=langgraph
docker logs --tail 20 uiep-backend

# 3) Rollback (si hiciera falta)
docker tag msbrossai-uiep-backend:rollback-20261030 msbrossai-uiep-backend:latest
docker compose -f infrastructure/docker-compose.yml up -d uiep-backend
```

Riesgo conocido post-despliegue: si en el futuro se activa `uiep-web`, el campo `code` contiene
código del motor (no el string de la demo) — su UI ya lo muestra como texto monoespaciado
(`code?.slice(0,2000)`), compatible.
