# 🚀 Blueprint Definitivo de Migración a Servidor Producción (MSBrossAI)

Este es el informe de máxima profundidad de la arquitectura actual que corre en tu macOS local. Está diseñado paso a paso para que cualquier SysAdmin, o un LLM (como Gemini o ChatGPT), sepa exactamente cómo reconstruir tu servidor Linux (Ubuntu/Debian) o VPS desde cero.

---

## 1. Topología de Red y Flujo de Tráfico

1. **Entrada de Tráfico:** `cloudflared` (Túnel de Cloudflare) capta las peticiones de `https://msbross.me` y las dirige al **Puerto 8080** interno.
2. **Gateway:** `proxy_server.js` (Express en Node.js) recibe todo en el 8080.
3. **Distribución de Rutas:** El proxy dirige el tráfico estático hacia `www/app/...` y las llamadas API a los diferentes puertos internos TCP/UDP.
4. **Capa de Voz / WebRTC:** Las conexiones Websocket pasan por el proxy (`/rtc`) y acaban en `livekit-server` (Puerto 7880). Los agentes de Python se comunican internamente.

---

## 2. Requisitos de Infraestructura (Instalación en nuevo servidor)

Para replicar el entorno, el nuevo servidor debe tener instalados los siguientes runtimes:

1. **Node.js (v18 o v20 LTS)** + `npm`.
2. **PM2** (`npm install -g pm2`). Esencial para la orquestación.
3. **Python 3.14** + `pip` + `venv`. Es crítico usar entornos virtuales para aislar dependencias de FastAPI y LiveKit.
4. **Cloudflared**: Demonio oficial de Cloudflare para el túnel.
5. **Redis** (Opcional, pero recomendado por LiveKit Server).
6. **LiveKit Server** nativo (Binario compilado).

---

## 3. Matriz de Puertos Internos (Bind 127.0.0.1)

¡Cuidado! Todo esto debe correr en `127.0.0.1` en el nuevo servidor. Solo el túnel expone hacia fuera.

| Nombre Microservicio | Puerto Asignado | Runtime |
| :--- | :--- | :--- |
| **msbross-proxy** (Gateway) | `8080` | Node.js |
| **LiveKit Server** (Core) | `7880` | Binario Go (LiveKit) |
| **nikolina-api-hub** | `8001` | Python 3.14 (Uvicorn) |
| **industrialpro-backend** | `8002` | Python 3.14 (Uvicorn) |
| **elitescout-server** | `8003` | Node (Next.js SSR) |
| **traductor-pro-server** | `8004` | Node.js (Express) |
| **msbross-backend** | `8005` | Python 3.14 |
| **iaputa-backend** | `8006` | Python 3.14 (Uvicorn) |
| **cuentos-magicos-backend** | `8007` | Python 3.14 (Uvicorn) |
| **web-restaurante-atenea** | `8009` | Python 3.14 (Uvicorn) |
| **jartosdto-backend** | `8010` | Python 3.14 (Uvicorn) |
| **gas-station-backend** | `3005` | Python 3.14 (Uvicorn) |
| **perfume-trading** | `3011` | Node (Next.js SSR) |
| **mapfre-gestion** | `3333` | Node (Next.js SSR) |
| **txa-fitness-pro** | `3456` | Node (Next.js SSR) |
| **it-english-backend** | `8787` | Node.js |
| **it-coach-agent** | `8082` | Python 3.14 (LiveKit Agent) |
| **nikolina-agent** | (TCP Interno) | Python 3.14 (LiveKit Agent) |
| **cuentos-magicos-celery** | (Cola de Tareas) | Bash / Python Celery |

---

## 4. Estructura de Directorios Crítica

Al clonar o copiar al nuevo servidor, debes preservar esta estructura milimétricamente:

```bash
/home/usuario/MSBrossAI/
 ├── ecosystem.config.js       # El orquestador maestro (20 procesos)
 ├── proxy_server.js           # Reverse Proxy + Seguridad
 ├── api_keys_vault.json       # ⚠️ BOVEDA SECRETA: Claves de Gemini, OpenAI, etc.
 ├── data/
 │    └── visits.json          # Base de datos plana de telemetría (¡Debe tener permisos de escritura!)
 ├── www/                      # Todos los frontends estáticos pre-compilados
 │    └── app/
 │        ├── combipro/
 │        ├── industrialpro/
 │        └── ... (16 SPAs)
 ├── apps/                     # Directorio de códigos fuente y backends
 │    ├── livekit-nikolina/    # (Requiere su propio venv: apps/livekit-nikolina/venv)
 │    ├── elitescout/
 │    ├── txa-fitness-pro/
 │    └── ... (22 apps en total)
 └── logs/                     # Archivos out/error de PM2
```

---

## 5. Instrucciones de Despliegue en el Nuevo Servidor

Para levantar a la bestia en el nuevo entorno, estos son los pasos secuenciales:

### Paso 1: Configurar la Seguridad (Bóveda)
Copia manualmente el archivo `api_keys_vault.json` y los `.env` de las bases de datos (Prisma de TXA Fitness, etc.). Nunca subas esto al repo de Git.

### Paso 2: Construir Entornos de Python (Venvs)
En macOS tenías los `venv/` creados para Mac. **Debes recrearlos en Linux**:
```bash
# Ejemplo para Nikolina
cd apps/livekit-nikolina
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
*(Debes repetir esto para: `gas-station`, `industrialpro`, `iaputa-os`, `msbross`, `cuentos-magicos`, `web-restaurante-atenea`, `jartosdto`)*.

### Paso 3: Compilar los Next.js (SSR)
A diferencia de los estáticos (React/Vite que ya están en `/www`), las apps Next.js requieren compilarse en el servidor:
```bash
# Ejemplo
cd apps/txa-fitness-pro
npm install
npm run build
```

### Paso 4: Levantar el Orquestador (PM2)
Una vez estén los `node_modules` listos y los `venv` de Python reconstruidos en Linux:
```bash
cd /home/usuario/MSBrossAI
npm install  # Para instalar http-proxy-middleware, express, etc. para proxy_server.js
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Configura PM2 para arrancar automáticamente tras un reinicio del servidor
```

### Paso 5: Autenticar el Túnel
El proceso `cloudflare-tunnel` en tu `ecosystem.config.js` ejecutará `cloudflared tunnel run msbross-main`. Debes autenticar tu máquina Linux en Cloudflare primero usando el comando `cloudflared tunnel login`.

---

## 6. Variables de Entorno de Alta Prioridad
Tu ecosistema depende fuertemente de inyecciones dinámicas desde `ecosystem.config.js` y archivos `.env`:
- **LiveKit**: Requiere `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.
- **IT Coach Agent**: Controlado por `LIVEKIT_WORKER_PORT=8082` (inyectado vía PM2) para evitar colisión con el agente de Nikolina.
- **Next.js Apps**: Inyectan dinámicamente `PORT`, `NODE_ENV=production` y `NEXT_SERVER_MODE=true` en sus shells de inicio.

Este blueprint garantiza que, si se sigue al pie de la letra, todo el sistema enrutará el tráfico a los mismos puertos, manteniendo los mismos límites de memoria (OOM Kills) que definiste para máxima resiliencia.
