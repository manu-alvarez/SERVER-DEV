# Fase 4 — UIEP Control Center: cabina de operación de la plataforma

Estado: implementado (backend + web), 90/90 tests (76 de fases previas + 14 de consola),
verificado en local con navegador real sobre datos reales y un run completo de agente
(Ollama `qwen3.5:4b`, CPU frío, 50.3 s, tool `clock` ejecutada y devuelta al modelo).

## Qué añade

De generador a plataforma de ejecución operable: panel con estado REAL de servicios,
gestión de AgentSpecs, conversación real con agentes (sesiones del runtime) y gestión de
perfiles de modelo — sin exponer el token de runtime al navegador.

## Arquitectura: BFF dentro de uiep-backend (sin servicio nuevo)

```
Navegador ──(contraseña de consola)──► /api/console/*  (uiep-backend:4000)
              cookie HttpOnly firmada      │
              + header anti-CSRF           ▼
                              servicios del runtime EN PROCESO
                              (spec-registry · model-gateway · agent-runtime ·
                               agent-runtime-store · tool-registry)
```

- **`UIEP_RUNTIME_TOKEN` nunca sale del servidor.** La consola delega en los servicios
  directamente (sin hop HTTP): la frontera de autenticación es el BFF.
- El operador se autentica con `UIEP_CONSOLE_PASSWORD` (≥8 chars, en
  `infrastructure/.env` del VPS, gitignored) → cookie `uiep_console` HttpOnly,
  SameSite=Lax, 12 h, HMAC-SHA256 con clave DERIVADA del password (la cookie no
  contiene la contraseña). Comparación timing-safe; login erróneo añade espera fija
  (700 ms) anti fuerza bruta.
- **Seguridad por defecto**: sin contraseña configurada → `503 console_disabled` en toda
  la superficie de consola (igual que el runtime con `runtime_disabled`).
- **Anti-CSRF**: las mutaciones exigen header `x-uiep-console: 1`; la cookie Lax no viaja
  en POSTs cruzados y el header lo refuerza estructuralmente.

## Endpoints de consola (`backend/routes/console.ts`)

| Método | Ruta | Papel |
|---|---|---|
| POST | `/api/console/auth/login` | `{password}` → cookie de sesión (401 con espera fija si falla) |
| GET | `/api/console/auth/session` | ¿sesión válida? `{authenticated, expiresAt}` |
| POST | `/api/console/auth/logout` | borra la cookie del navegador |
| GET | `/api/console/overview` | Dashboard: servicios (backend + proveedor real), contadores, agentes, perfiles, últimos runs |
| GET | `/api/console/tools` | ToolSpecs completos (permisos, adapter, esquema) |
| GET | `/api/console/sessions[/:id]` | sesiones (resumen) / detalle con historial + runs resumidos |
| GET | `/api/console/runs[/:id]` | ejecuciones (resumen) / run completo |
| POST | `/api/console/runtime/sessions` | crea sesión (delega `createSession`) |
| POST | `/api/console/runtime/sessions/:id/run` | turno **ASÍNCRONO** → `202 {executionId}` |

Además, los endpoints públicos de Fases 1-2 (`/api/specs`, `/api/profiles/*`) se consumen
desde la UI tal cual (mismo origen vía `/_uiep/api`).

## Ejecución asíncrona (turnos largos sin perder la sesión)

- El motor se partió en `prepareRun` / `executeRun` con **un solo bucle**: `runAgent()`
  mantiene el contrato síncrono de Fase 3 (la API protegida `/api/runtime/*` no cambia) y
  el nuevo `startAgentRun()` persiste el registro `running` al momento, despacha el bucle
  en background y devuelve `executionId` → la consola responde `202` y el cliente hace
  **polling** de `GET /api/console/runs/:id` (2.2 s) hasta estado terminal.
- El turno sobrevive a recargas: el Playground detecta al cargar una sesión un run
  `running` y **reanuda el polling** (banner de reconexión).
- **Sweep de arranque** (`sweepInterruptedRuns` en `server.ts`): ejecuciones que quedaron
  `running` tras un reinicio del contenedor se marcan `failed` con error
  `runtime_restarted` — nunca se simula un resultado.

## Web (`apps/uiep/apps/web` → `www/app/uiep`)

Reescritura completa de `@uiep/web` (Vite + React 19 + MUI, tema oscuro, **HashRouter** —
el estático vive bajo dos superficies del proxy: dominio `uiep.manuelalvarez.dev` y
`/app/uiep`; API siempre mismo origen `/_uiep/api`). Sin axios: `fetch` con
`credentials: same-origin` + header anti-CSRF en mutaciones.

| Vista | Contenido |
|---|---|
| **Dashboard** | 4 cuadrantes: Servicios (backend activo, proveedor alcanzable + capabilities REALES, token runtime configurado, consola configurada), Ejecuciones recientes (tabla con inspector), Agentes, Modelos. Auto-refresh 15 s. |
| **Agentes** | Agent Manager: listado + editor estructurado de AgentSpec (identidad, rol/objetivo/instrucciones, ModelProfile por referencia, autorización de herramientas **deny-by-default** con chips por permiso, toggle de aprobación explícita, slider de iteraciones, vista de contrato JSON en vivo) contra `/api/specs` (mismo esquema del backend). |
| **Playground** | Rail de sesiones + chat REAL: turnos asíncronos (202 → polling), transcript con chips de tool-message (resultado real del adaptador), inspector de ejecuciones por sesión, recuperación de turnos en curso tras recargar. |
| **Modelos** | Model Manager: perfiles (provider/model/endpoint `env:VAR`) con Salud (GET /api/tags + modelo presente), Probar (completación acotada) y Resolve (descriptor de invocación) — todo contra el gateway real. |
| **Herramientas** | Tool Registry: adaptadores cerrados, permisos requeridos, esquema de entrada y mapa de autorización por agente (la edición vive en el Agent Manager). |
| **RunDialog** | Inspector de ejecución: estado, iteraciones, duración, llamadas a herramientas (resultado o motivo de rechazo), errores y texto final + descarga JSON. |

El build emite **directamente** a `www/app/uiep` (superficie ya cableada en
`msbross-proxy`: `DOMAIN_APP_MAP['uiep.manuelalvarez.dev']='uiep'`, fallback
`/app/uiep/*` → `index.html`, API `/_uiep` → `uiep-backend:4000`, cabeceras anti-cache).
Publicar = commit de los artefactos + `git pull` en el VPS.

## Seguridad (resumen)

- Cookie HttpOnly + SameSite=Lax + Secure según `req.secure` (detrás de Traefik/proxy);
  12 h de TTL; MAC sobre expiración con clave derivada.
- Comparaciones timing-safe (login y MAC). Sin secretos en logs ni respuestas (test
  dedicado: el token de runtime y la contraseña nunca se materializan en ninguna respuesta).
- Rate limit global existente (200 req/min) aplica a toda la superficie.
- `UIEP_CONSOLE_PASSWORD` se añade como passthrough en `infrastructure/docker-compose.yml`
  y `apps/uiep/docker-compose.yml` (valor solo en `infrastructure/.env` del VPS).

## Pruebas (14 nuevas, `console-app.test.ts`)

Login correcto/incorrecto/incompleto · 503 sin contraseña · sesión válida/401
anónimo/401 falsificada/401 expiración malformada · credenciales jamás materializadas ·
overview con estado real · tools completos · CSRF 403 en mutación sin header ·
sesión 201 · turno asíncrono 202 + polling → `completed` con tool ejecutada ·
historial completo user/tool/assistant · listados incluyen lo creado ·
404 sesión inexistente · logout Max-Age=0 · sweep `runtime_restarted`.

## Despliegue (operación)

1. VPS: `git fetch && git reset --hard origin/main` → install → build backend.
2. Añadir `UIEP_CONSOLE_PASSWORD=$(openssl rand -hex 24)` a `infrastructure/.env`
   (NO tocar las claves preexistentes de COACH_/POSTGRES_/MINIO_/ADMIN_).
3. Ancla de rollback: `docker tag msbrossai-uiep-backend:latest msbrossai-uiep-backend:rollback-fase3`.
4. `docker compose build uiep-backend` (gate) → `up -d uiep-backend`.
5. Evidencia: estático 200 en dominio raíz, login erróneo→401/correcto→200+cookie,
   sin cookie→401, sin CSRF→403, overview real, turno real con `qwen3.5:4b` + `clock`
   (202 → polling → completed), cookies sobreviven a `docker restart`, sweep de
   interrumpidos, `/api/generate` legacy 200, Secret Scan verde.
