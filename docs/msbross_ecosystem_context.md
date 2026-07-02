# 🌐 MSBrossAI Ecosystem: Architecture & Context

Este documento es un resumen arquitectónico estructurado de "Nivel Producción" del ecosistema **MSBrossAI**. Está diseñado para ser copiado y pegado como **Contexto de Sistema (System Prompt)** en herramientas como Gemini, Claude o ChatGPT.

---

## 1. Topología General y Orquestación
El ecosistema es una arquitectura monolítica/monorepo de **Microservicios** basada en macOS y gestionada en tiempo real mediante **PM2** (`ecosystem.config.js`). Contiene 20 procesos activos simultáneos que incluyen servidores Python, proxies de Node.js, agentes de LiveKit y microfrontends (React/Vite y Next.js).

### Servidor Proxy Central (`msbross-proxy`)
- **Tecnología:** Node.js (Express), `http-proxy-middleware`.
- **Puerto:** `8080` (expuesto a Cloudflare Tunnel).
- **Función:** Actúa como *Gateway* (Puerta de enlace) y *Reverse Proxy*. Enruta todo el tráfico a los diferentes microservicios según el *path* (ej. `/_nikolina`, `/_atenea`).
- **Seguridad:** Implementa `express-rate-limit`, compresión Gzip/Brotli, Headers de seguridad estrictos (HSTS, NoSniff, X-Frame-Options) y control de CORS riguroso (solo permite orígenes autorizados como `https://msbross.me`).

## 2. Pila Tecnológica (Tech Stack)
- **Frontend Core:** React 18, Vite, TypeScript, TailwindCSS, Zustand (Gestor de Estado), Framer Motion (Animaciones), Lucide React (Iconos).
- **Backend Core:** Node.js (Express) para proxies. Python 3.14 (FastAPI) para lógica intensiva, servidores de IA y agentes.
- **Base de Datos (Borrador/Futuro):** SQLite, persistencia mediante archivos locales (`data/visits.json`) y abstracciones vía Prisma ORM (en apps específicas). Anteriormente se usó Supabase pero se ha planificado migrar a bases propias (microhosting) para evitar bloqueos por inactividad.
- **IA y WebRTC (Voz Realtime):** LiveKit Server, LiveKit Agents Framework (Python), `@livekit/components-react`.
- **Modelos IA por Defecto:** Gemini 3.5 Flash (`gemini-3.5-flash`) para texto, y Gemini 3.1 Flash Live Preview (`gemini-3.1-flash-live-preview`) para interacciones de voz conversacional de muy baja latencia.

## 3. Seguridad y Gestión de Secretos (Zero-Trust)
- **Bóveda de Claves:** Ninguna API Key está expuesta o *hardcodeada* en el código de frontends. Todas las llamadas LLM pasan por el proxy trasero que inyecta los tokens. Las contraseñas y tokens residen en un archivo ultrasecreto: `api_keys_vault.json`.
- **Git Hooks (Husky):** Se implementa un escáner pre-commit estricto que aborta cualquier subida a Git si detecta firmas de claves de Google (ej. `AIzaSy`) o OpenAI (ej. `sk-proj`), asegurando tolerancia cero ante fugas.

## 4. Agentes de Inteligencia Artificial (LiveKit Multi-Agent)
El ecosistema posee capacidades WebRTC nativas de muy baja latencia gestionadas por el núcleo `livekit-nikolina`. 
- **Enrutamiento Dinámico:** El backend (`main.py`) despacha conexiones WebRTC según el prefijo de la sala (`coach-` vs `restaurant-`).
- **Agentes Activos:**
  1. `nikolina-agent`: Asistente IA original especializado en tareas de restauración/hostelería (Atenea/Nikolina).
  2. `it-coach-agent`: Agente orquestado en `coach_agent.py` que actúa como Profesora Nativa de Inglés C1/C2 (IT English Coach). Utiliza una personalidad estricta, detecta mala gramática, pronuncia con voz natural (`Aoede`) y corre en un puerto HTTP aislado (`8082`) para evitar colisiones.

## 5. Aplicaciones (Microservicios Destacados)
Entre los 20 procesos en PM2, destacan:
- `msbross-proxy` (Gateway)
- `it-english-backend` & `it-english-coach-frontend` (PWA de aprendizaje de idiomas con Tutor de Voz IA).
- `livekit-nikolina` (Core de comunicación de voz en tiempo real).
- `cuentos-magicos`, `industrialpro`, `elitescout`, `txa-fitness-pro`, `perfume-trading` (Diversos SaaS y herramientas sectorizadas del portfolio MSBrossAI).

## 6. Flujo de Trabajo (Ecosystem Workflow)
Cualquier desarrollador (o IA) que trabaje en el código está sujeto al `ecosystem_workflow_checklist.md`:
1. Nunca usar mocks; siempre APIs reales.
2. Usar rutas absolutas cuando un app corre bajo un `basePath`.
3. Al modificar frontend: siempre ejecutar `npm run build` y luego `pm2 restart <app>`.
4. El trabajo debe documentarse y consolidarse en ramas estables mediante Husky/Git.

---
**Instrucción para el LLM receptor:** 
*Considera esta estructura como la base de la verdad absoluta. Si vas a generar código o sugerir nuevas integraciones, debes respetar el uso del proxy para evitar exponer APIs, mantener la estructura multi-agente para LiveKit y aplicar Clean Code con TypeScript/Python.*
