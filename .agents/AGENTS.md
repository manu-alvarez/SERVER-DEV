# REGLAS Y CONTEXTO DEL PROYECTO (LA BIBLIA MSBROSS)

## 🛑 REGLAS DE ORO ABSOLUTAS (NIVEL GODMODE OMNI) 🛑

1. **EL ENTORNO ES EL VPS, NUNCA LOCAL.**
   - TODO el código que se escribe y se prueba aquí, está pensado para ejecutarse en el servidor **VPS Contabo**.
   - En el entorno local (macOS del usuario), **Docker NO funciona** y no es el objetivo ejecutar los servicios en local.
   - macOS solo se usa como editor de código y para compilar archivos estáticos antes del despliegue.

2. **COMPILACIÓN MANUAL DE FRONTENDS ESTÁTICOS (React/Vite).**
   - El VPS **NO** compila los proyectos React/Vite. El script de despliegue `deploy-vps.yml` ignora las carpetas `dist` y `node_modules` de los subdirectorios en `apps/`.
   - Para desplegar cambios en cualquier app SPA (ej. `iaprod-os`, `msbross-assistant`):
     1. **⚠️ CRÍTICO VITE:** Asegúrate de que `vite.config.ts` tenga `base: './'` configurado. Si usas `base: '/'`, los estáticos fallarán al cargarse en el subdirectorio del proxy.
     2. Ejecutar `npm run build` en su directorio local.
     3. Copiar/mover el contenido de la carpeta `dist/` resultante a su carpeta correspondiente en `www/app/[nombre_app]/` en la raíz del proyecto.
     4. Hacer commit de la carpeta `www/` y empujar al repositorio para que el despliegue sincronice los estáticos.

3. **CONFIDENCIALIDAD ESTRICTA.**
   - Esta Biblia (`LA_BIBLIA.md` y `.agents/AGENTS.md`) y todos los `.env` **NO DEBEN SUBIRSE NUNCA A GITHUB**. Ya están en el `.gitignore`.

---

## 🏗️ ARQUITECTURA GENERAL

El servidor orquesta más de 20 micro-aplicaciones, agentes de IA, bases de datos y herramientas internas. La arquitectura se divide en 3 capas principales:

### 1. CAPA DE ENTRADA (TRAEFIK)
- **Tecnología**: Docker (Traefik v3).
- **Ubicación**: `infrastructure/traefik/docker-compose.yml`.
- **Función**: Proxy reverso principal. Recibe TODO el tráfico HTTPS de `*.manuelalvarez.dev` (puertos 80 y 443).
- **Seguridad**: Gestiona certificados SSL (Let's Encrypt), cabeceras de seguridad globales (HSTS, XSS, Frame Options) y autenticación básica (`admin`) para acceso interno.

### 2. CAPA DE ENRUTAMIENTO Y ESTÁTICOS (MSBROSS PROXY)
- **Tecnología**: Node.js (Express), gestionado por PM2.
- **Ubicación**: `infrastructure/msbross-proxy/proxy_server.js`.
- **Puerto interno**: `8080`.
- **Función**: 
  - Sirve TODAS las aplicaciones estáticas (SPAs) desde la carpeta `/home/ubuntu/MSBrossAI/www/app/`.
  - Resuelve subdominios a rutas de aplicaciones estáticas (ej. `iaprod.manuelalvarez.dev` → `/www/app/iaprod-os`).
  - Actúa como API Gateway, redirigiendo prefijos (ej. `/_nikolina`, `/_iaprod`) a los backends correspondientes que corren en puertos internos específicos (`8001`, `8006`, etc.).

### 3. CAPA DE SERVICIOS (BACKENDS & AGENTES)
Los servicios se ejecutan de dos maneras:
- **PM2 (Node.js y Python/FastAPI):**
  - **Ubicación**: Se definen en `ecosystem.config.js` en la raíz.
  - **Servicios Clave**: 
    - Backends API: `iaprod-backend` (8006), `elitescout-backend` (8003), `cuentos-magicos` (8007), `msbross-backend` (8000), `traductor-backend` (8004), `atenea-backend` (8009).
    - Agentes LiveKit (Voz): `nikolina-agent` (Python script que se conecta al servidor LiveKit).
- **Docker Compose:**
  - **Ubicación**: `infrastructure/docker-compose.yml` (y `apps/*/docker-compose.yml` para aislados).
  - **Servicios Clave**: 
    - Base de datos (PostgreSQL, Redis, ChromaDB).
    - Servidor LiveKit (WebRTC, puerto 7880).
    - Apps completas en contenedores (ej. `mapfre`, `txa-fitness-pro`, `perfume-trading`).
    - **Ollama / Modelos Locales:** Residen en la máquina y se exponen a través de la red privada de Tailscale (`http://100.100.2.10`). **NUNCA** uses `localhost` en los backends Docker para acceder a Ollama.

---

## 🚀 FLUJO DE DESPLIEGUE (DEPLOYMENT)

El despliegue está 100% automatizado mediante GitHub Actions (`.github/workflows/deploy-vps.yml`), pero con matices CRÍTICOS:

1. **Trigger:** Se ejecuta mediante *Workflow Dispatch* (manualmente desde GitHub o por CLI).
   - ⚠️ **CRÍTICO PARA EL CLI:** Para disparar el pipeline sin errores `401 Bad credentials` provocados por variables temporales en macOS, **SIEMPRE usa**: `env -u GITHUB_TOKEN gh workflow run deploy-vps.yml`
2. **Sincronización (Rsync):** 
   - Copia la carpeta `apps/` al VPS **omitiendo** `node_modules`, `dist`, `.next` y `.env`.
   - Copia la carpeta estática `www/` **exactamente como está en el repo** al VPS.
   - Copia archivos de infraestructura y `ecosystem.config.js`.
3. **Re-compilación en VPS:**
   - Para las apps Docker (`txa-fitness-pro`, `mapfre`, `perfume-trading`), el script ejecuta `docker build` en el servidor.
   - Para `elitescout` (Next.js), el `.next/` se compila en el runner de GitHub Actions y se sube por `rsync`.
4. **Reinicio de Servicios:**
   - Ejecuta `docker compose up -d --build`.
   - Ejecuta `pm2 reload ecosystem.config.js --update-env`.

---

## 📁 ESTRUCTURA DEL SISTEMA DE ARCHIVOS

- `/apps/` -> Código fuente de todas las micro-apps (frontends, backends, agentes de voz).
- `/www/` -> **ARCHIVOS COMPILADOS**. Es la carpeta raíz web del servidor de Node.js. `www/app/` contiene cada app estática inyectada por nosotros en local.
- `/infrastructure/` -> Configuraciones de servidores, proxys, traefik y Docker.
- `ecosystem.config.js` -> Biblia de los procesos PM2 (gestor de procesos principal).
- `.github/workflows/` -> Pipelines CI/CD.

---

## 🔐 MANEJO DE SECRETOS Y PERMISOS
- Las API Keys nunca deben quedar en código plano en frontends.
- En Node.js Proxy, las claves se leen de `api_keys_vault.json` o `.env`.
- Si se manejan credenciales sensibles, los archivos `.env` en el servidor se mantienen con permisos estrictos (`chmod 600`).
- La llave SSH y el acceso al VPS Contabo están guardados en GitHub Secrets (`VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER`).
