# PLAN MAESTRO - ECOSISTEMA manuelalvarez.dev

## VISION FINAL (HYPER STACK)

```
Runtime:       Bun 1.x (reemplaza Node.js)
Frontend:      Astro 5 + React Islands (reemplaza Next.js/Vite/HTML)
Backend:       FastAPI + Granian (Rust HTTP server) (reemplaza Express/Uvicorn)
Proxy:         Traefik v3 (UNICA puerta de entrada)
Contenedor:    Caddy (sirve estaticos + reverse proxy local)
Despliegue:    Docker Compose (unicamente)
```

---

## ARQUITECTURA FINAL

```
INTERNET
    |
Traefik v3 (SSL/TLS automatico Let's Encrypt)
    |
    |--- app-X.manuelalvarez.dev ---> container: app-X ---> Caddy :80 ---> /static (Astro build)
    |                                                              └--> /api/* (Granian/FastAPI localhost:8000)
    |
    |--- app-Y.manuelalvarez.dev ---> container: app-Y ---> Caddy :80 ---> /static (Astro build)
    |
    └--- infra.manuelalvarez.dev ---> Traefik dashboard / Portainer / Kuma
```

### Estructura de CADA contenedor tipo (con backend):

```yaml
  app-NOMBRE:
    build: ./apps/NOMBRE
    container_name: app-NOMBRE
    labels:
      - traefik.enable=true
      - traefik.http.routers.NOMBRE.rule=Host(`NOMBRE.manuelalvarez.dev`)
      - traefik.http.routers.NOMBRE.entrypoints=websecure
      - traefik.http.routers.NOMBRE.tls.certresolver=myresolver
    networks:
      - traefik-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Estructura de CADA app tipo (con API + frontend):

```
apps/NOMBRE/
├── frontend/          # Astro 5 + React Islands
│   ├── src/
│   │   ├── components/  # React components (Islands)
│   │   ├── layouts/
│   │   └── pages/
│   ├── astro.config.mjs
│   ├── package.json
│   └── tsconfig.json
├── api/               # FastAPI + Granian
│   ├── main.py
│   ├── routers/
│   ├── models/
│   ├── requirements.txt
│   └── Dockerfile
├── Caddyfile
└── docker-compose.yml  (opcional, para dev local)
```

### Estructura de CADA app tipo (solo frontend estatico):

```
apps/NOMBRE/
├── src/               # Astro 5
│   ├── components/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── package.json
├── Dockerfile         # Bun build -> Caddy serve
├── Caddyfile
└── docker-compose.yml
```

---

## FASES DE EJECUCION

### FASE 0: LIMPIEZA (HOY)
**Objetivo: Ecosistema limpio con la estructura actual, sin roturas.**

| # | Tarea | Estado | Verificacion |
|   |-------|--------|-------------|
| 0.1 | Dominio appgenerator -> appgen | ✅ HECHO | curl 200 appgen.manuelalvarez.dev / 404 appgenerator |
| 0.2 | Eliminar msbross-voice labels | ✅ HECHO | docker-compose.yml sin labels de msbross-voice |
| 0.3 | Reducir msbross-proxy (solo root + elitescout) | ✅ HECHO | Proxy de 24 a 2 dominios |
| 0.4 | Crear servicios nginx:alpine para apps estaticas | ✅ HECHO | 21 containers nginx:alpine |
| 0.5 | Eliminar dominios estaticos del proxy | ✅ HECHO | labels eliminados, proxies /_traductor y /_atenea eliminados |
| 0.6 | Eliminar PM2 atenea (se queda nikolina-livekit-server) | ✅ HECHO | pm2 delete web-restaurante-atenea-backend |
| 0.7 | Migrar atenea backend de PM2 a container | ✅ HECHO | Dockerfile + atenea-backend service |
| 0.8 | Migrar traductor API (proxy -> Traefik) | ✅ HECHO | PathPrefix + StripPrefix en traductor-backend |
| 0.9 | Verificar TODAS las apps con curl 200 | ✅ HECHO | 25/25 endpoints 200 OK |
| 0.10 | Git commit | ✅ HECHO | c7c8f3b "feat(infra): Fase 0 - limpieza y contenerizacion" |

### FASE 1: BACKEND HYPER (Sprint 1 - Esta semana)
**Objetivo: Todos los backends en FastAPI + Granian.**

| # | Tarea | Estado | Dependencias |
|   |-------|--------|-------------|
| 1.1 | Migrar traductor-pro (Express -> FastAPI + Granian) | ✅ HECHO | Fase 0.8 |
| 1.2 | Actualizar industrialpro a Granian (Uvicorn -> Granian) | ✅ HECHO | - |
| 1.3 | Actualizar cuentos-magicos a Granian | ✅ HECHO | - |
| 1.4 | Actualizar atenea a Granian | ✅ HECHO | Fase 0.7 |
| 1.5 | Actualizar msbross-backend (http.server nativo -> FastAPI + Granian) | ✅ HECHO | - |
| 1.5b | Actualizar gas-station a Granian (Uvicorn -> Granian) | ✅ HECHO | - |
| 1.5c | Actualizar iaputa a Granian (Uvicorn -> Granian) | ✅ HECHO | - |
| 1.5d | Actualizar jartosdto a Granian (Uvicorn -> Granian) | ✅ HECHO | - |
| 1.5e | Actualizar nikolina-api-hub a Granian (Uvicorn -> Granian) | ✅ HECHO | - |
| 1.6 | Benchmark de rendimiento (antes/despues) | ✅ HECHO | Fase 1.1-1.5 |
| 1.7 | Git commit: "feat(backend): migrated to FastAPI+Granian" | ✅ HECHO b5bc688 | |

### FASE 2: FRONTEND GODMODE (Sprint 2 - Proxima semana)
**Objetivo: Todos los frontends en Astro 5 + Bun.**

| # | App | Stack actual | Stack nuevo | Estado |
|---|-----|-------------|-------------|--------|
| 2.1 | app-generator | React+Vite | Astro 5 + React Islands | ⬜ |
| 2.2 | assistant | React+Vite | Astro 5 + React Islands | ⬜ |
| 2.3 | combipro | React | Astro 5 | ⬜ |
| 2.4 | cv | React | Astro 5 | ⬜ |
| 2.5 | edelweiss | React | Astro 5 | ⬜ |
| 2.6 | elitescout | React+Vite | Astro 5 | ⬜ |
| 2.7 | expositator | PWA (React?) | Astro 5 + PWA | ⬜ |
| 2.8 | gasstation | PWA (React?) | Astro 5 + PWA | ⬜ |
| 2.9 | iaputa | React | Astro 5 | ⬜ |
| 2.10 | itenglish | React | Astro 5 | ⬜ |
| 2.11 | jartosdto | Next.js (static) | Astro 5 | ⬜ |
| 2.12 | logisearch | React | Astro 5 | ⬜ |
| 2.13 | logitrack | React | Astro 5 | ⬜ |
| 2.14 | mapfre (frontend) | Angular?/Next? | Astro 5 | ⬜ |
| 2.15 | mano | React Native | Mantiene (app movil) | ⬜ |
| 2.16 | maya | React+Vite | Astro 5 | ⬜ |
| 2.17 | mokotools | Vanilla JS | Astro 5 | ⬜ |
| 2.18 | nikolina | React | Astro 5 | ⬜ |
| 2.19 | perfume (frontend) | Next.js SSR | Astro 5 + API | ⬜ |
| 2.20 | taskflow | React | Astro 5 | ⬜ |
| 2.21 | traductor (frontend) | React+Vite | Astro 5 | ⬜ |
| 2.22 | txafitness (frontend) | Next.js SSR | Astro 5 + API | ⬜ |
| 2.23 | atenea (frontend) | HTML vanilla | Astro 5 | ⬜ |

### FASE 3: DOCKER UNIFICADO (Sprint 3)
**Objetivo: Contenedores Caddy + Dockerfile unificado.**

| # | Tarea | Estado |
|---|-------|--------|
| 3.1 | Migrar nginx:alpine -> Caddy para apps estaticas | ⬜ |
| 3.2 | Crear Dockerfile base unificado (multi-stage: Bun build + Caddy serve) | ⬜ |
| 3.3 | Healthchecks en todos los servicios | ⬜ |
| 3.4 | Labels Traefik identicos en formato canonical | ⬜ |
| 3.5 | Script de CI/CD (build + test + deploy) | ⬜ |

### FASE 4: INFRA Y MONITOREO (Sprint 4)
**Objetivo: Infraestructura blindada.**

| # | Tarea | Estado |
|---|-------|--------|
| 4.1 | Dashboard Traefik configurado | ⬜ |
| 4.2 | Uptime Kuma monitorizando TODAS las apps | ⬜ |
| 4.3 | Alertas (email/telegram) si alguna app cae | ⬜ |
| 4.4 | Backup automatico de docker-compose + .env | ⬜ |
| 4.5 | Logs centralizados (Loki o similar) | ⬜ |

---

## INVENTARIO COMPLETO DE APPS

| # | App | Dominio | Tipo actual | Backend | Frontend | Dockerfile |
|---|-----|---------|-------------|---------|----------|------------|
| 1 | App Generator | appgen.manuelalvarez.dev | estatica | No | React+Vite | ⬜ |
| 2 | MSBross Assistant | assistant.manuelalvarez.dev | estatica | msbross-backend (FastAPI+Granian) | React+Vite | ⬜ |
| 3 | Atenea | atenea.manuelalvarez.dev | backend+frontend | FastAPI+Granian | HTML vanilla | ✅ |
| 4 | CombiPro | combipro.manuelalvarez.dev | estatica | No | React | ⬜ |
| 5 | Cuentos Magicos | cuentos.manuelalvarez.dev | backend+frontend | FastAPI+Granian+Celery | React | ✅ |
| 6 | CV Portfolio | cv.manuelalvarez.dev | estatica | No | React | ⬜ |
| 7 | Edelweiss | edelweiss.manuelalvarez.dev | estatica | No | React | ⬜ |
| 8 | EliteScout | elitescout.manuelalvarez.dev | estatica | No | React+Vite | ⬜ |
| 9 | Expositator RTE | expositator.manuelalvarez.dev | estatica | No | PWA (?) | ⬜ |
| 10 | Gas Station | gasstation.manuelalvarez.dev | estatica | No | PWA (?) | ⬜ |
| 11 | IAPuta OS | iaputa.manuelalvarez.dev | estatica | No | React | ⬜ |
| 12 | Industrial Pro | industrial.manuelalvarez.dev | backend+frontend | FastAPI+Granian | React | ✅ |
| 13 | IT English Coach | itenglish.manuelalvarez.dev | estatica | No | React | ⬜ |
| 14 | JartosDTo | jartosdto.manuelalvarez.dev | estatica | No | Next.js (static) | ⬜ |
| 15 | LogiSearch | logisearch.manuelalvarez.dev | estatica | No | React | ⬜ |
| 16 | LogiTrack | logitrack.manuelalvarez.dev | estatica | No | React | ⬜ |
| 17 | Mano Electrica Azul | mano.manuelalvarez.dev | redirect | No | 301 → Google Play | - |
| 18 | Mapfre | mapfre.manuelalvarez.dev | backend+frontend | Next.js SSR | Next.js SSR | ✅ |
| 19 | Tu Energia Maya | maya.manuelalvarez.dev | redirect | No | 302 → GitHub Pages | - |
| 20 | Moko-Tools | mokotools.manuelalvarez.dev | estatica | No | Vanilla JS | ⬜ |
| 21 | Nikolina | nikolina.manuelalvarez.dev | estatica | No | React | ⬜ |
| 22 | Perfume Trading | perfume.manuelalvarez.dev | backend+frontend | Next.js SSR | Next.js SSR | ✅ |
| 23 | TaskFlowPro | taskflow.manuelalvarez.dev | estatica | No | React | ⬜ |
| 24 | Traductor PRO | traductor.manuelalvarez.dev | backend+frontend | FastAPI+Granian | React+Vite | ✅ |
| 25 | TxaFitnessPro | txafitness.manuelalvarez.dev | backend+frontend | Next.js SSR | Next.js SSR | ✅ |
| 26 | msbross-backend | assistant.manuelalvarez.dev/_msbross | solo API | FastAPI+Granian | No | ✅ |

---

## DICCIONARIO DE DOMINIOS CANONICOS (DEFINITIVO)

| App | Dominio | Por que |
|-----|---------|---------|
| App Generator | appgen.manuelalvarez.dev | Corto, sin guion |
| Assistant | assistant.manuelalvarez.dev | OK |
| Atenea | atenea.manuelalvarez.dev | OK |
| CombiPro | combipro.manuelalvarez.dev | OK |
| Cuentos | cuentos.manuelalvarez.dev | OK |
| CV | cv.manuelalvarez.dev | OK |
| Edelweiss | edelweiss.manuelalvarez.dev | OK |
| EliteScout | elitescout.manuelalvarez.dev | OK |
| Expositator | expositator.manuelalvarez.dev | OK |
| Gas Station | gasstation.manuelalvarez.dev | OK |
| IAPuta | iaputa.manuelalvarez.dev | OK |
| Industrial Pro | industrial.manuelalvarez.dev | ✅ (ya cambiado de industrialpro) |
| IT English Coach | itenglish.manuelalvarez.dev | OK |
| JartosDTo | jartosdto.manuelalvarez.dev | OK |
| LogiSearch | logisearch.manuelalvarez.dev | OK |
| LogiTrack | logitrack.manuelalvarez.dev | OK |
| Mano Electrica | mano.manuelalvarez.dev | OK |
| Mapfre | mapfre.manuelalvarez.dev | OK |
| Maya | maya.manuelalvarez.dev | OK |
| Moko-Tools | mokotools.manuelalvarez.dev | OK |
| Nikolina | nikolina.manuelalvarez.dev | OK |
| Perfume Trading | perfume.manuelalvarez.dev | ✅ (ya cambiado de perfume-trading) |
| TaskFlowPro | taskflow.manuelalvarez.dev | OK |
| Traductor PRO | traductor.manuelalvarez.dev | OK |
| TxaFitnessPro | txafitness.manuelalvarez.dev | OK |

---

## ARBOL DE DIRECTORIOS FINAL (VISION COMPLETA)

```
SERVER-DEV/
├── PLAN/
│   ├── plan-maestro.md          (ESTE ARCHIVO)
│   ├── backlog.md               (sprints detallados)
│   └── arquitectura.md          (diagramas C4)
├── infrastructure/
│   ├── docker-compose.yml       (UNICO archivo, todos los servicios)
│   ├── traefik/
│   │   └── traefik.yml          (config estatica)
│   ├── caddy/
│   │   └── Caddyfile            (template base)
│   └── scripts/
│       ├── deploy.sh
│       ├── verify-all.sh
│       └── backup.sh
├── apps/
│   ├── app-generator/           (Astro 5 + Bun)
│   ├── assistant/               (Astro 5 + Bun + conecta a msbross-backend)
│   ├── atenea/                  (Astro 5 + FastAPI + Granian)
│   ├── combipro/                (Astro 5 + Bun)
│   ├── cuentos-magicos/         (Astro 5 + FastAPI + Granian + Celery)
│   ├── cv-portfolio/            (Astro 5 + Bun)
│   ├── edelweiss/               (Astro 5 + Bun)
│   ├── elitescout/              (Astro 5 + Bun)
│   ├── expositator-rte/         (Astro 5 + Bun)
│   ├── gas-station/             (Astro 5 + Bun + PWA)
│   ├── iaputa-os/               (Astro 5 + Bun + WebSocket)
│   ├── industrialpro/           (Astro 5 + FastAPI + Granian)
│   ├── it-english-coach/        (Astro 5 + Bun)
│   ├── jartosdto/               (Astro 5 + Bun)
│   ├── livekit-nikolina/        (Astro 5 + Bun)
│   ├── logisearch/              (Astro 5 + Bun)
│   ├── logitrack/               (Astro 5 + Bun)
│   ├── mapfre/                  (Astro 5 + Bun + FastAPI/Granian)
│   ├── mano/                    (Astro 5 + Bun + React Native doc)
│   ├── maya/                    (Astro 5 + Bun)
│   ├── moko-tools/              (Astro 5 + Bun)
│   ├── msbross-assistant/       (renombrar: assistant/)
│   ├── msbross-backend/         (FastAPI + Granian)
│   ├── perfume-trading/         (Astro 5 + FastAPI/Granian)
│   ├── taskflow-pro/            (Astro 5 + Bun)
│   ├── traductor-pro/           (Astro 5 + FastAPI + Granian)
│   ├── txa-fitness-pro/         (Astro 5 + FastAPI/Granian)
│   └── web-restaurante-atenea/  (renombrar: atenea/)
├── www/                         (MUERE - static pasa a cada app/)
└── LOGS/
```

## AUDITORIA COMPLETA DEL ECOSISTEMA (2026-07-06)

### MAPA DE RUTEO ACTUAL

```
INTERNET :443
  │
  ▼ Traefik v3 (Let's Encrypt TLS)
  │
  ├──► manuelalvarez.dev ──────────► msbross-proxy:8080 (Node.js Express)
  │     └── Sirve www/index.html (portfolio)
  │     └── DOMAIN_APP_MAP reescribe a /app/{app}/
  │     └── APIs proxy: /_nikolina, /_gas-station, /_industrialpro,
  │                      /app/elitescout, /_iaputa, /_itenglish,
  │                      /_cuentosmagicos, /_jartosdto, /_coach, /rtc (WS)
  │
  ├──► elitescout.manuelalvarez.dev ──► msbross-proxy:8080
  │     └── Sirve app elitescout + proxy a elitescout-backend:8003
  │
  ├──► *.manuelalvarez.dev ───────────► nginx:alpine (21 apps estaticas)
  │     appgen, assistant, combipro, cv, edelweiss, expositator,
  │     gasstation, iaputa, industrial, itenglish, jartosdto,
  │     logisearch, logitrack, mano, maya, mokotools, nikolina,
  │     taskflow, traductor, cuentos, atenea
  │
  ├──► traductor.manuelalvarez.dev ───► traductor-backend:8004 (FastAPI+Granian)
  │     └── /_traductor/* (StripPrefix)
  │
  ├──► assistant.manuelalvarez.dev ───► msbross-backend:8005 (FastAPI+Granian)
  │     └── /_msbross/* (StripPrefix)
  │
  ├──► atenea.manuelalvarez.dev ──────► atenea-backend:8009 (FastAPI+Granian)
  │
  ├──► itcoach.manuelalvarez.dev ─────► it-coach-agent:8082
  │
  ├──► mapfre.manuelalvarez.dev ──────► mapfre:3333 (Next.js SSR)
  ├──► perfume.manuelalvarez.dev ─────► perfume-trading:3000 (Next.js SSR)
  ├──► txafitness.manuelalvarez.dev ──► txa-fitness-pro:3000 (Next.js SSR)
  │
  ├──► portainer.manuelalvarez.dev ───► portainer:9000
  ├──► monitor.manuelalvarez.dev ─────► uptime-kuma:3001
  └──► traefik.manuelalvarez.dev ─────► Traefik dashboard (api@internal)
```

### INVENTARIO DETALLADO (26 APPS + 3 INFRA + ROOT)

#### A. Root domain
| Dominio | Contenido | Tecnologia | Sirve desde |
|---------|-----------|------------|-------------|
| manuelalvarez.dev/ | Portfolio del ecosistema | React (msbross-frontend) | www/index.html (proxy src) |

#### B. Static SPAs (21) — nginx:alpine + proxy fallback
| # | App | Dominio | Stack | Backend asociado | Dockerfile |
|---|-----|---------|-------|-----------------|------------|
| 1 | App Generator | appgen.manuelalvarez.dev | React+Vite | - | ⬜ |
| 2 | Assistant | assistant.manuelalvarez.dev | React+Vite | msbross-backend (FastAPI+Granian) | ⬜ |
| 3 | Combipro | combipro.manuelalvarez.dev | React | - | ⬜ |
| 4 | CV Portfolio | cv.manuelalvarez.dev | React | - | ⬜ |
| 5 | Edelweiss | edelweiss.manuelalvarez.dev | React | - | ⬜ |
| 6 | Expositator RTE | expositator.manuelalvarez.dev | PWA (React) | - | ⬜ |
| 7 | Gas Station | gasstation.manuelalvarez.dev | PWA (React) | gas-station-backend (FastAPI+Granian) | ⬜ |
| 8 | IAPuta OS | iaputa.manuelalvarez.dev | React | iaputa-backend (FastAPI+Granian) | ⬜ |
| 9 | Industrial Pro | industrial.manuelalvarez.dev | React | industrialpro-backend (FastAPI+Granian) | ⬜ |
| 10 | IT English Coach | itenglish.manuelalvarez.dev | React | it-english-backend (Node.js) | ⬜ |
| 11 | JartosDTo | jartosdto.manuelalvarez.dev | Next.js (static) | jartosdto-backend (FastAPI+Granian) | ⬜ |
| 12 | LogiSearch | logisearch.manuelalvarez.dev | React | - | ⬜ |
| 13 | LogiTrack | logitrack.manuelalvarez.dev | React | - | ⬜ |
| 14 | Moko-Tools | mokotools.manuelalvarez.dev | Vanilla JS | - | ⬜ |
| 15 | Maya | maya.manuelalvarez.dev | React+Vite | - (redirect GitHub Pages) | ⬜ |
| 16 | Nikolina | nikolina.manuelalvarez.dev | React | nikolina-api-hub (FastAPI+Granian) | ⬜ |
| 17 | TaskFlowPro | taskflow.manuelalvarez.dev | React | - | ⬜ |
| 18 | Traductor PRO | traductor.manuelalvarez.dev | React+Vite | traductor-backend (FastAPI+Granian) | ⬜ |
| 19 | Cuentos Magicos | cuentos.manuelalvarez.dev | React | cuentos-magicos-backend (FastAPI+Granian+Celery) | ⬜ |
| 20 | Atenea | atenea.manuelalvarez.dev | HTML vanilla | atenea-backend (FastAPI+Granian) | ⬜ |
| 21 | EliteScout | elitescout.manuelalvarez.dev | React+Vite | elitescout-backend (Node.js) | ⬜ |

#### C. Backend-only services
| # | App | Ruta | Stack | Dependencias |
|---|-----|------|-------|-------------|
| 22 | msbross-backend | assistant.manuelalvarez.dev/_msbross | FastAPI+Granian | ninguno |
| 23 | nikolina-api-hub | nikolina.manuelalvarez.dev (via proxy) | FastAPI+Granian | ninguno |
| 24 | it-english-backend | itenglish.manuelalvarez.dev (via proxy) | Node.js (Express?) | ninguno |
| 25 | elitescout-backend | elitescout.manuelalvarez.dev (via proxy) | Node.js (Next.js?) | elitescout-db (Postgres) |
| 26 | cuentos-magicos-celery | (interno) | Celery workers | cuentos-db + redis |

#### D. Full-stack SSR (Next.js)
| # | App | Dominio | Stack | Dockerfile |
|---|-----|---------|-------|------------|
| 27 | Mapfre | mapfre.manuelalvarez.dev | Next.js SSR | ✅ |
| 28 | Perfume Trading | perfume.manuelalvarez.dev | Next.js SSR | ✅ |
| 29 | TxaFitnessPro | txafitness.manuelalvarez.dev | Next.js SSR | ✅ |

#### E. Redirects
| Dominio | Destino | Tipo |
|---------|---------|------|
| mano.manuelalvarez.dev | Google Play Store | nginx 301 |
| maya.manuelalvarez.dev | GitHub Pages (TuEnergiaMaya) | nginx ? |

#### F. Infraestructura
| Servicio | Dominio | Funcion |
|----------|---------|---------|
| Traefik | traefik.manuelalvarez.dev | Dashboard (con basic auth) |
| Portainer | portainer.manuelalvarez.dev | Gestion de contenedores |
| Uptime Kuma | monitor.manuelalvarez.dev | Monitoreo de uptime |

### SUBPAGINAS / RUTAS DE CADA APP

Basado en el codigo del proxy y las apps desplegadas:
- **Portfolio (manuelalvarez.dev)**: /, /apps, /architecture, /profile, /contact
- **Assistant**: / (SPA con routing interno React)
- **Traductor**: / (SPA con formulario de traduccion)
- **Industrial Pro**: / (SPA con dashboard de control procesos)
- **Cuentos Magicos**: /, /create, /stories/detail/ (Next.js static export)
- **JartosDTo**: /, /_not-found, /404 (Next.js static export)
- **Resto de SPAs**: / (single page apps con routing interno)

### ISSUES DETECTADOS

| # | Tipo | Descripcion | Impacto | Solucion |
|---|------|-------------|---------|----------|
| F1-001 | Bug | Docker images atenea:latest y :granian tenian main.py con sintaxis rota | BAJO - containers activos usan bind mounts | ✅ RECONSTRUIDO |
| F1-002 | Bug | www/index.html no existia (root domain 500) | ALTO - manuelalvarez.dev caido | ✅ RESTAURADO |
| F1-003 | Bug | mano.manuelalvarez.dev servia portfolio en vez de redirect Google Play | ALTO - pagina incorrecta | ✅ CORREGIDO |
| F1-004 | Bug | Faltaba label service=msbross-proxy-svc en router root de Traefik | MEDIO - ruteo implicito | ✅ CORREGIDO |
| F1-005 | Legacy | Proxy Node.js tiene DOMAIN_APP_MAP con 21 apps que ya no usa (nginx bypass) | BAJO - codigo muerto | Limpiar en Fase 2/3 |
| F1-006 | Legacy | it-english-backend usa node:22-bookworm-slim (Debian pesado) | BAJO | Migrar a alpine |
| F1-007 | Legacy | elitescout-backend sin imagen Docker propia (usa node:22-alpine directo) | BAJO | Crear Dockerfile |
| F1-008 | API | GROQ API key expirada (401), Gemini keys formato AQ. invalido, OpenRouter :free deprecados | MEDIO - afecta traductor y msbross-backend | Conseguir keys validas |
| F1-009 | Nota | msbross-proxy es segunda puerta (viola regla #3 del plan) | ESTRUCTURAL | Se resuelve en Fase 3 |
| F1-010 | Nota | www/ es build artifact no commitado inicialmente | PROCESO | ✅ YA EN GIT |

### RESUMEN EJECUTIVO

| Metrica | Valor |
|---------|-------|
| Apps totales | 29 (26 apps + 3 infra) |
| Backends en Granian | 9/9 (100%) ✅ |
| Backends en Node.js legacy | 2 (elitescout, it-english) |
| Contenedores activos | ~35 |
| Dominios .manuelalvarez.dev | 26 |
| PM2 residual | 1 (nikolina-livekit-server) |
| Fase 0 completada | ✅ 100% |
| Fase 1 completada | ✅ 100% |
| Fase 2 (Frontend Godmode) | ⬜ 0% — 23 apps por migrar |
| Bugs activos | 0 (todos corregidos) |
| Issues legacy | 4 (F1-005 a F1-008) |

---

## REGLAS FIJAS (NO NEGOCIABLES)

1. **Cada app = su propio contenedor** - Sin excepciones
2. **Un solo docker-compose.yml** - Toda la infraestructura
3. **Traefik es la UNICA puerta** - No hay proxy intermedio
4. **Cero PM2** - Todo en Docker
5. **Cero duplicados de dominio** - Cada dominio apunta a un solo servicio
6. **Mismo formato de labels Traefik** - Identico en todas las apps
7. **Misma estructura de Dockerfile** - Multi-stage build + Caddy serve
8. **Nunca tocar codigo no solicitado** - Solo se migra lo planeado
9. **Temperatura 0.1** - Sin IA creativa, solo ejecucion precisa
10. **Un commit por fase completada** - Mensajes en ingles formato conventional

## PROGRESO GLOBAL

```
FASE 0: LIMPIEZA      [████████████] 100%  ✅ c7c8f3b
FASE 1: BACKEND HYPER [████████████] 100%  ✅ b5bc688
FASE 1.5: HOTFIXES   [████████████] 100%  ✅ 36a9449 (mano redirect + root fix)
FASE 2: FRONTEND GOD  [░░░░░░░░░░░░]   0%
FASE 3: DOCKER UNIFIC [░░░░░░░░░░░░]   0%
FASE 4: INFRA MONITOR [░░░░░░░░░░░░]   0%
```
