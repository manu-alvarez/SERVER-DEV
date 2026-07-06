# PLAN DE REESTRUCTURACION - ECOSISTEMA manuelalvarez.dev

## Objetivo
Eliminar el 100% de duplicados, inconsistencias y capas innecesarias.
Cada app = 1 contenedor = 1 dominio canonico.
Sin proxy Express. Sin PM2. Sin msbross-voice. Sin rutas duplicadas.

---

## 1. MUEREN (eliminar)

| Elemento | Motivo |
|----------|--------|
| msbross-proxy (Express proxy) | Capa innecesaria. Traefik es la unica puerta. |
| msbross-voice.manuelalvarez.dev | Duplicado de /_msbross |
| PM2 (ambos procesos) | Nikolina y Atenea pasan a containers |
| mapfre ruta Traefik directa | Duplicado con ruta proxy |
| appgenerator.manuelalvarez.dev | Renombrado a appgen.manuelalvarez.dev (YA HECHO) |

---

## 2. TODAS LAS APPS - MISMA ESTRUCTURA

TODAS se definen en docker-compose.yml con:

```
  app-NOMBRE:
    container_name: app-NOMBRE
    labels:
      - traefik.enable=true
      - traefik.http.routers.NOMBRE.rule=Host(NOMBRE.manuelalvarez.dev)
      - traefik.http.routers.NOMBRE.entrypoints=websecure
      - traefik.http.routers.NOMBRE.tls.certresolver=myresolver
    networks:
      - traefik-network
    restart: unless-stopped
```

SOLO cambia image, volumes, y puerto interno segun el tipo de app.

---

## 3. LISTA COMPLETA (26 apps, sin divisiones)

| # | Dominio | Container | Tipo | Puerto |
|---|---------|-----------|------|--------|
| 1 | appgen.manuelalvarez.dev | app-appgen | nginx:alpine (www/app/app-generator/) | 80 |
| 2 | assistant.manuelalvarez.dev | app-assistant | nginx:alpine (www/app/assistant/) | 80 |
| 3 | atenea.manuelalvarez.dev | app-atenea | FastAPI backend + HTML frontend | 8000 |
| 4 | combipro.manuelalvarez.dev | app-combipro | nginx:alpine (www/app/combipro/) | 80 |
| 5 | cuentos.manuelalvarez.dev | app-cuentos | FastAPI + Celery + frontend | 8000 |
| 6 | cv.manuelalvarez.dev | app-cv | nginx:alpine (www/app/cv/) | 80 |
| 7 | edelweiss.manuelalvarez.dev | app-edelweiss | nginx:alpine (www/app/edelweiss/) | 80 |
| 8 | elitescout.manuelalvarez.dev | app-elitescout | nginx:alpine (www/app/elitescout/) | 80 |
| 9 | expositator.manuelalvarez.dev | app-expositator | nginx:alpine (www/app/expositator-rte/) | 80 |
| 10 | gasstation.manuelalvarez.dev | app-gasstation | nginx:alpine (www/app/gas-station/) | 80 |
| 11 | iaputa.manuelalvarez.dev | app-iaputa | nginx:alpine (www/app/iaputa-os/) | 80 |
| 12 | industrial.manuelalvarez.dev | app-industrialpro | FastAPI + React frontend | 8000 |
| 13 | itenglish.manuelalvarez.dev | app-itenglish | nginx:alpine (www/app/it-english-coach/) | 80 |
| 14 | jartosdto.manuelalvarez.dev | app-jartosdto | nginx:alpine (www/app/jartosdto/) | 80 |
| 15 | logisearch.manuelalvarez.dev | app-logisearch | nginx:alpine (www/app/logisearch/) | 80 |
| 16 | logitrack.manuelalvarez.dev | app-logitrack | nginx:alpine (www/app/logitrack/) | 80 |
| 17 | mano.manuelalvarez.dev | app-mano | nginx:alpine (www/app/msbross/) | 80 |
| 18 | mapfre.manuelalvarez.dev | app-mapfre | Next.js SSR | 3000 |
| 19 | maya.manuelalvarez.dev | app-maya | nginx:alpine (www/app/maya/) | 80 |
| 20 | mokotools.manuelalvarez.dev | app-mokotools | nginx:alpine (www/app/moko-tools/) | 80 |
| 21 | nikolina.manuelalvarez.dev | app-nikolina | nginx:alpine (www/app/livekit-nikolina/) | 80 |
| 22 | perfume.manuelalvarez.dev | app-perfume | Next.js SSR | 3000 |
| 23 | taskflow.manuelalvarez.dev | app-taskflow | nginx:alpine (www/app/taskflow/) | 80 |
| 24 | traductor.manuelalvarez.dev | app-traductor | Express backend + React frontend | 3000 |
| 25 | txafitness.manuelalvarez.dev | app-txafitness | Next.js SSR | 3000 |
| 26 | (sin dominio) | app-msbross-backend | Python AI server | 8005 |

---

## 4. LO QUE HAY QUE HACER

### Apps nginx:alpine (17 apps)
SOLO anadir el service en docker-compose.yml con el volumen a www/app/.
No requieren build. Se deployan al instante.

### Apps con backend propio que ya existen como container (6 apps)
- industrialpro, perfume, txafitness, mapfre, cuentos, msbross-backend
- SOLO normalizar labels Traefik al mismo formato

### Apps que necesitan NUEVO Dockerfile (2 apps)
- atenea: PM2 -> container (FastAPI + frontend estatico)
- traductor: proxy -> container (Express + React built)

---

## 5. PLAN DE ATAQUE (sin downtime)

1. Preparar docker-compose.yml COMPLETO con los 26 servicios
2. Hacer build de atenea y traductor containers
3. Deploy progresivo: primero los nginx, luego los custom
4. Verificar cada dominio con curl 200
5. Eliminar msbross-proxy
6. Eliminar msbross-voice labels
7. pm2 delete all + pm2 unstartup
8. Verificar que 0 procesos fuera de Docker

---

## 6. VERIFICACION

Cada app:
curl -s -o /dev/null -w "%{http_code}" https://X.manuelalvarez.dev/  -> 200
