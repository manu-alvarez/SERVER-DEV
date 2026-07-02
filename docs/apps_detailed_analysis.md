# 🔬 Análisis Minucioso del Ecosistema MSBrossAI (22 Microservicios)

Este documento es una autopsia técnica, aplicación por aplicación, de todo el directorio `/apps` del monorepo **MSBrossAI**. Diseñado específicamente para inyectar contexto masivo en LLMs (Gemini/ChatGPT) a la hora de escalar, refactorizar o planificar nuevas arquitecturas.

---

## 1. Núcleos de Inteligencia Artificial (AI Cores)

### 🧠 `livekit-nikolina`
- **Stack:** Python 3.14, FastAPI, LiveKit Agents Framework.
- **Rol:** Motor central de WebRTC y agentes conversacionales de voz en tiempo real (Baja Latencia).
- **Procesos PM2:** `nikolina-agent`, `nikolina-livekit-server`, `nikolina-api-hub`, `it-coach-agent`.
- **Estructura Interna:** Usa enrutamiento de tokens (`main.py`) para despachar usuarios a distintos agentes según el *room prefix*.
- **Integración Modelos:** Utiliza `gemini-3.1-flash-live-preview` nativo para Voz (`Aoede`) y comportamiento estricto por System Prompts.

### 🧠 `it-english-coach-frontend`
- **Stack:** React 18, Vite, TypeScript, TailwindCSS, Zustand, Framer Motion, `@livekit/components-react`, Three.js (`@react-three/fiber`).
- **Rol:** PWA interactiva para la Profesora de Inglés C1/C2 (Nikolina Coach).
- **UI/UX:** Incorpora un "Orbe de Voz" (VoiceAssistantControlBar) y visualización 3D. Gestión de estado mediante Zustand (con planes futuros de migrar a base de datos persistente SQLite/Postgres en lugar de Supabase).

### 🧠 `web-restaurante-atenea`
- **Stack:** Python (FastAPI).
- **Rol:** Backend original de Atenea (Asistente de Restaurante). Probablemente el servicio precursor a la integración LiveKit masiva, gestionando reservas y flujos de hostelería conversacional.

---

## 2. Plataformas SaaS y Productos Pro

### 💼 `txa-fitness-pro`
- **Stack:** Next.js 14/15, Prisma ORM, NextAuth (Auth.js), TailwindCSS.
- **Rol:** Plataforma de "Behavioral Change Modeling" y "Diagnostic Funnel".
- **Dependencias Clave:** `@google/genai` (Gemini SDK integrado), `bcryptjs` (Seguridad), `date-fns`.
- **Estado:** Aplicación Fullstack robusta orientada a negocio. Conexión de base de datos activa.

### 💼 `elitescout`
- **Stack:** Next.js, React Query (`@tanstack/react-query`), Leaflet (Mapas), Framer Motion.
- **Rol:** Plataforma de "Family Travel Finder" o reclutamiento/scouting.
- **Integración AI:** Conectado profundamente con `@google/generative-ai` para generar recomendaciones de alto valor.

### 💼 `traductor-pro`
- **Stack:** Node.js (Fullstack), Material UI (`@mui/material`), Framer Motion.
- **Rol:** Herramienta SaaS para traducción profesional. Tiene su propio backend en PM2 (`traductor-pro-server`).

### 💼 `cuentos-magicos`
- **Stack:** Python (Celery + Backend API).
- **Rol:** Generador de cuentos/historias infantiles. Usa colas de tareas asíncronas (`cuentos-magicos-celery` en PM2) para procesar la generación de texto/imágenes con IA sin bloquear el servidor.

---

## 3. Microservicios Industriales y de Gestión (React + Material UI)

Estas aplicaciones comparten un patrón arquitectónico similar, fuertemente apoyado en Material UI (MUI) e iconos vectoriales para dashboards B2B:

- 🏭 **`industrialpro`**: React/Vite + MUI + Axios. Dashboard B2B industrial.
- ⛽ **`gas-station`**: React/Vite + MUI. Sistema de gestión de gasolineras/estaciones de servicio.
- 📦 **`logisearch`**: React/Vite + MUI. Logística y búsqueda de paquetería/inventario.
- 📊 **`taskflow-pro`**: React/Vite + MUI + Framer Motion. Gestor de tareas empresariales.
- 📈 **`mapfre-infocol`**: App activa en PM2, presumiblemente frontend/backend para informes o gestión de pólizas/datos vinculada a sector seguros.

---

## 4. Herramientas de Ecosistema y Utilidades

- 🛠 **`jartosdto`**: Next.js Fullstack. Integra Vercel AI SDK (`@ai-sdk/openai`, `@ai-sdk/react`). Probablemente una herramienta de generación de DTOs o refactorización de código asistida por IA.
- 🛠 **`moko-tools`**: React/Vite. Herramienta visual con Framer Motion, `clsx` y `lucide-react`.
- 🛠 **`app-generator`**: React/Vite. Herramienta de scaffolding o constructor visual interno del ecosistema.
- 🛠 **`combipro`**: React/Vite + Framer Motion. Combinador o herramienta matemática/lógica.
- 📝 **`expositator-rte`**: Posible editor de texto enriquecido (Rich Text Editor).

---

## 5. El Corazón del Monorepo (Root & Proxy)

### 🌍 `msbross` (Portfolio Landing)
- **Stack:** Python (FastAPI/Flask) / Next.js estático.
- **Rol:** Es la cara pública del creador. Servida en `https://msbross.me` a través del túnel.

### 🛡️ `proxy_server.js` (Gateway Central)
- **Tecnología:** Express.js + `http-proxy-middleware`.
- **Análisis Minucioso:**
  - Puerto 8080. Todas las apps pasan por aquí.
  - Oculta las API Keys (cargándolas de `api_keys_vault.json`).
  - Tiene un endpoint manual en `/_coach/api/evaluate` para bypass de seguridad LLM.
  - Controla la telemetría global persistiendo en `data/visits.json`.
  - **Seguridad:** Bloquea llamadas externas por CORS, implementa Rate Limit (200 req/min).

---

## 💡 Prompt Recomendado para el LLM:
*"Soy el arquitecto de este ecosistema de 22 aplicaciones (MSBrossAI). Todo mi tráfico pasa por un proxy en Node (msbross-proxy) que protege mis API Keys de Google Gemini. Tengo múltiples apps en React/Vite y Next.js. El proxy despacha las conexiones WebRTC a un clúster Python (LiveKit) donde corren agentes IA en tiempo real (gemini-3.1-flash). Cuando te pida crear una nueva app o refactorizar una existente, asume este stack, nunca pidas credenciales por frontend y asume persistencia SQLite/Local o Proxy en lugar de Firebase/Supabase."*
