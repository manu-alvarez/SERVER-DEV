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
|---|-------|--------|-------------|
| 0.1 | Dominio appgenerator -> appgen | ✅ HECHO | curl 200 appgen.manuelalvarez.dev / 404 appgenerator |
| 0.2 | Eliminar msbross-voice labels | ⬜ | docker-compose.yml lineas 450-468 |
| 0.3 | Eliminar msbross-proxy container | ⬜ | docker rm msbross-proxy + borrar carpeta |
| 0.4 | Unificar labels Traefik en docker-compose.yml | ⬜ | Mismo formato exacto en ~26 servicios |
| 0.5 | Crear servicios nginx:alpine para apps estaticas | ⬜ | 17 servicios nuevos en docker-compose |
| 0.6 | Eliminar PM2 (atenea + nikolina) | ⬜ | pm2 delete all, pm2 unstartup |
| 0.7 | Migrar atenea backend de PM2 a container | ⬜ | Dockerfile + service en docker-compose |
| 0.8 | Migrar traductor de proxy a container propio | ⬜ | Dockerfile + service en docker-compose |
| 0.9 | Verificar TODAS las apps con curl 200 | ⬜ | Script de verificacion automatizado |
| 0.10 | Git commit: "feat(infra): unified docker-compose, removed proxy and PM2" | ⬜ | |

### FASE 1: BACKEND HYPER (Sprint 1 - Esta semana)
**Objetivo: Todos los backends en FastAPI + Granian.**

| # | Tarea | Estado | Dependencias |
|---|-------|--------|-------------|
| 1.1 | Migrar traductor-pro (Express -> FastAPI + Granian) | ⬜ | Fase 0.8 |
| 1.2 | Actualizar industrialpro a Granian (Uvicorn -> Granian) | ⬜ | - |
| 1.3 | Actualizar cuentos-magicos a Granian | ⬜ | - |
| 1.4 | Actualizar atenea a Granian | ⬜ | Fase 0.7 |
| 1.5 | Actualizar msbross-backend a Granian | ⬜ | - |
| 1.6 | Benchmark de rendimiento (antes/despues) | ⬜ | Fase 1.1-1.5 |
| 1.7 | Git commit: "feat(backend): migrated to FastAPI+Granian" | ⬜ | |

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
| 2 | MSBross Assistant | assistant.manuelalvarez.dev | estatica | msbross-backend (/_msbross) | React+Vite | ⬜ |
| 3 | Atenea | atenea.manuelalvarez.dev | backend+frontend | FastAPI (PM2) | HTML vanilla | ⬜ |
| 4 | CombiPro | combipro.manuelalvarez.dev | estatica | No | React | ⬜ |
| 5 | Cuentos Magicos | cuentos.manuelalvarez.dev | backend+frontend | FastAPI+Celery | React | ✅ |
| 6 | CV Portfolio | cv.manuelalvarez.dev | estatica | No | React | ⬜ |
| 7 | Edelweiss | edelweiss.manuelalvarez.dev | estatica | No | React | ⬜ |
| 8 | EliteScout | elitescout.manuelalvarez.dev | estatica | No | React+Vite | ⬜ |
| 9 | Expositator RTE | expositator.manuelalvarez.dev | estatica | No | PWA (?) | ⬜ |
| 10 | Gas Station | gasstation.manuelalvarez.dev | estatica | No | PWA (?) | ⬜ |
| 11 | IAPuta OS | iaputa.manuelalvarez.dev | estatica | No | React | ⬜ |
| 12 | Industrial Pro | industrial.manuelalvarez.dev | backend+frontend | FastAPI | React | ✅ |
| 13 | IT English Coach | itenglish.manuelalvarez.dev | estatica | No | React | ⬜ |
| 14 | JartosDTo | jartosdto.manuelalvarez.dev | estatica | No | Next.js (static) | ⬜ |
| 15 | LogiSearch | logisearch.manuelalvarez.dev | estatica | No | React | ⬜ |
| 16 | LogiTrack | logitrack.manuelalvarez.dev | estatica | No | React | ⬜ |
| 17 | Mano Electrica Azul | mano.manuelalvarez.dev | estatica | No | React Native (app) | ⬜ |
| 18 | Mapfre | mapfre.manuelalvarez.dev | backend+frontend | Next.js SSR | Next.js SSR | ✅ |
| 19 | Tu Energia Maya | maya.manuelalvarez.dev | estatica | No | React+Vite | ⬜ |
| 20 | Moko-Tools | mokotools.manuelalvarez.dev | estatica | No | Vanilla JS | ⬜ |
| 21 | Nikolina | nikolina.manuelalvarez.dev | estatica | No | React | ⬜ |
| 22 | Perfume Trading | perfume.manuelalvarez.dev | backend+frontend | Next.js SSR | Next.js SSR | ✅ |
| 23 | TaskFlowPro | taskflow.manuelalvarez.dev | estatica | No | React | ⬜ |
| 24 | Traductor PRO | traductor.manuelalvarez.dev | backend+frontend | Express | React+Vite | ⬜ |
| 25 | TxaFitnessPro | txafitness.manuelalvarez.dev | backend+frontend | Next.js SSR | Next.js SSR | ✅ |
| 26 | msbross-backend | (sin dominio) | solo API | Python AI | No | ✅ |

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
FASE 0: LIMPIEZA      [████░░░░░░░░]  25%  (0.1 hecho)
FASE 1: BACKEND HYPER [░░░░░░░░░░░░]   0%
FASE 2: FRONTEND GOD  [░░░░░░░░░░░░]   0%
FASE 3: DOCKER UNIFIC [░░░░░░░░░░░░]   0%
FASE 4: INFRA MONITOR [░░░░░░░░░░░░]   0%
```

## EMPEZAMOS FASE 0 AHORA

Orden de ejecucion:
1. ✅ appgenerator -> appgen (HECHO)
2. ⬜ Eliminar msbross-voice (docker-compose lineas 450-468)
3. ⬜ Matar mapfre duplicado (ruta Traefik directa)
4. ⬜ Escribir docker-compose completo con ~26 servicios
5. ⬜ Deploy progresivo y verificar cada app
6. ⬜ Eliminar msbross-proxy
7. ⬜ Eliminar PM2
8. ⬜ Git commit
