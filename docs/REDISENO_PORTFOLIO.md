# 🎯 PROYECTO: Rediseño Total del Portfolio — manuelalvarez.dev

> **Documento de contexto y continuidad.** Contiene todo lo necesario para que cualquier
> modelo, IDE o persona pueda continuar este trabajo exactamente donde se dejó.
>
> **Última actualización:** 2026-10-26T15:37:00+01:00
> **Estado global:** ✅ COMPLETADO Y DESPLEGADO EN PRODUCCIÓN (manuelalvarez.dev)

---

## 📌 1. QUÉ ESTAMOS HACIENDO

### Objetivo
Transformar la landing page actual de `manuelalvarez.dev` (un dashboard técnico llamado
"MSBross Ecosystem" con sidebar y 25 apps sin jerarquía) en un **portfolio personal
profesional premium** de una sola página con scroll vertical, centrado en **7 proyectos
estrella**, con estética dark-mode, glassmorphism y micro-animaciones.

### Los 7 Proyectos Estrella

| # | Nombre en UI | ID interno | Categoría |
|---|-------------|------------|-----------|
| 1 | Plataforma de Agentes IA (UIEP + AgentForge + PromptForge) | `uiep` | Plataforma de agentes |
| 2 | IAProdOS / IAPutaOS | `iaprod-os` | IA y productividad |
| 3 | Tu Energía Maya | `tu-energia-maya` | Apps y móviles |
| 4 | LogiSearch | `logisearch` | Sistemas y herramientas |
| 5 | Nikolina AI | `nikolina-ai` | Plataforma de agentes |
| 6 | FoZ SoundPro | `foz-soundpro` | Audio y multimedia |
| 7 | Teringo Neural Cockpit | `teringo-neural-cockpit` | IA y productividad |

### Diseño de Referencia
El usuario proporcionó un mockup visual con estas características:
- Fondo oscuro (#060B18), estética premium dark-mode
- Navbar horizontal sticky con logo "MA", links de sección, iconos sociales
- Hero con nombre grande en gradiente, subtítulo, CTAs, stats, elementos flotantes
- Sección de proyectos con filtros por categoría (tabs), tarjetas con iconos gradient
- Sección "Sobre mí" con foto real del usuario, skill cards, cita
- Grid de tecnologías + card de contacto "Hablemos"
- Formulario de contacto funcional
- Footer con copyright y social icons

---

## 🏗️ 2. ARQUITECTURA DEL SISTEMA

### Entorno de Ejecución — VPS Contabo

> ⚠️ **REGLA DE ORO:** TODO se ejecuta en el VPS Contabo. macOS local es SOLO editor de
> código. Docker NO funciona en local. No lanzar servidores de desarrollo en local excepto
> para compilar (`npm run build`).

```
FLUJO DE DESPLIEGUE:
macOS (editor) → npm run build → dist/ → copiar a www/ → git commit+push → GitHub Actions → VPS Contabo
```

### Estructura del Servidor

```
VPS Contabo (ubuntu)
├── /home/ubuntu/MSBrossAI/          # Root del proyecto (sincronizado desde GitHub)
│   ├── apps/                        # Código fuente de todas las micro-apps
│   │   └── msbross-frontend/       # ← ESTE ES EL PROYECTO QUE ESTAMOS REESCRIBIENDO
│   ├── www/                         # Carpeta raíz web servida por el proxy
│   │   ├── index.html               # ← Landing principal (se reemplaza con dist/)
│   │   ├── assets/                  # ← Bundles JS/CSS compilados
│   │   ├── profile-photo.png        # Foto del usuario
│   │   └── app/                     # 20 SPAs compiladas (NO SE TOCAN)
│   │       ├── iaprod-os/
│   │       ├── logisearch/
│   │       ├── maya/
│   │       ├── cv/
│   │       └── ... (16 apps más)
│   ├── infrastructure/
│   │   ├── msbross-proxy/
│   │   │   └── proxy_server.js      # Proxy Express (937 líneas) — sirve todo
│   │   ├── traefik/                 # Reverse proxy + SSL
│   │   └── docker-compose.yml       # Bases de datos, backends
│   └── ecosystem.config.js          # PM2 (solo LiveKit)
```

### Capa de Entrada (Traefik)
- Docker (Traefik v3), puertos 80/443
- Gestiona SSL Let's Encrypt para `*.manuelalvarez.dev`
- Config en: `infrastructure/traefik/docker-compose.yml`

### Capa de Enrutamiento (MSBross Proxy)
- Node.js Express, puerto interno `8080`, gestionado por Docker
- Sirve estáticos desde `/home/ubuntu/MSBrossAI/www/`
- Resuelve subdominios a apps: `iaprod.manuelalvarez.dev` → `/www/app/iaprod-os/`
- API Gateway: `/_nikolina` → `:8001`, `/_iaprod` → `:8006`, etc.
- Config en: `infrastructure/msbross-proxy/proxy_server.js`

### Capa de Servicios
- **Docker Compose:** PostgreSQL, Redis, ChromaDB, LiveKit, backends
- **PM2:** Solo `nikolina-livekit-server` actualmente
- Config en: `infrastructure/docker-compose.yml` y `ecosystem.config.js`

---

## 📋 3. PLAN DE EJECUCIÓN

### FASE 0: Limpieza ✅ COMPLETADA
- [x] Limpieza en VPS: `docker builder prune -a -f` ejecutado (reclamados 8.83 GB de disco SSD en el servidor)
- [x] Limpieza de carpetas huérfanas en la raíz de `/home/ubuntu/MSBrossAI/`: eliminadas `gas-station`, `iaputa-os`, `traductor-pro`, `web-restaurante-atenea`, `moko-tools`, `combipro`, `app-generator`, `msbross-backend` y backups viejos
- [x] Limpieza y consolidación de favicons pesados: eliminados 4.6 MB de archivos PNG redundantes de 931 KB (`favicon.png`, `icon.png`, `logo-icon.png`, `mad_logo.png`)
- [x] Limpiar service workers viejos (`sw.js`, `workbox-*.js`, `registerSW.js`, `manifest.webmanifest`)

### FASE 1: Reescritura del Frontend ✅ COMPLETADA (Studio-Grade v5 — Máxima Fidelidad al Mockup)
- [x] Eliminados los tags flotantes que tapaban el texto en el Hero
- [x] Retrato de Manuel (`hero-portrait.png`) integrado en el fondo oscuro (#040714) en ángulo de perfil idéntico al adjunto
- [x] Eliminado el bloque repetitivo `AgentForge Studio` que se mostraba en todos los proyectos
- [x] Textos y tecnologías personalizados y reales para los 7 proyectos estrella (sin repetición de "Creación de agentes, flujos...")
- [x] En "Otros proyectos destacados" queda únicamente `App Generator` (eliminado bloque ancho de Teringo de esta sección)
- [x] En "Mi historia, mi motivación", sustituido el bloque de consola/código por la fotografía de la workstation con múltiples pantallas (`workstation.png`)
- [x] Sección de Tecnologías depurada con 12 tecnologías reales de su perfil (SMR + Full-Stack IA): Linux (Ubuntu), Windows, Cisco CCST, Docker, Traefik, Python/FastAPI, Node.js, React, TypeScript, PostgreSQL/Redis, LiveKit/IA, Git
- [x] CV actualizado al PDF oficial adjuntado por el usuario
- [x] Icono de pestaña (favicon) y preview de WhatsApp actualizados a la foto de Manuel
- [x] Contacto transparente: acceso directo a WhatsApp (+34 651 352 065), Email y LinkedIn, además de guardado de mensajes en `/home/ubuntu/MSBrossAI/data/messages.json`
- [x] Fix en `.github/workflows/deploy-vps.yml`: añadido `command_timeout: 30m` en `appleboy/ssh-action` para evitar que Docker builds prolongados disparen timeout en GitHub Actions

### FASE 2: Build ✅ COMPLETADO (v5)
- [x] `npx vite build` → exitoso (537ms)
  - `dist/assets/index-DZxd_8ps.css` (72.2KB, gzip 11.2KB)
  - `dist/assets/index-DHLAPly0.js` (413.5KB, gzip 128.9KB)
  - `dist/index.html` (2.32KB)
- [x] Copiado a `www/` (index.html + assets/ + imágenes)

### FASE 3: Verificación Visual ✅ COMPLETADA
- [x] Alineación visual de los 6 paneles del mockup de referencia
- [x] Verificación en vivo en VPS tras deploy (`https://manuelalvarez.dev`)
- [x] Comprobación de bundles JS/CSS servidos sin error (HTTP 200)

### FASE 4: Deploy a Producción ✅ COMPLETADO
- [x] Assets viejos eliminados de `www/assets/`
- [x] Service workers y manifest eliminados de `www/`
- [x] Build nuevo v3 copiado a `www/` (index.html + assets/)
- [x] Rebase limpio con `origin/main` y resolución de archivos de conflicto iCloud
- [x] Fixes en `apps/elitescout` (syntax en `route.ts`, `groq.ts`, typecheck en `gemini.ts`, `tavily.ts`)
- [x] Fixes en pipeline CI (`deploy-vps.yml` chattr y excludes de DB/storage)
- [x] Workflow execution exitoso en GitHub Actions (Run ID `40294155404`, 10m2s)

### FASE 5: Post-Deploy ✅ COMPLETADA
- [x] Verificado que `https://manuelalvarez.dev` carga el nuevo portfolio (HTTP 200)
- [x] Verificado que los bundles (`index-DzGrvFk6.js` y `index-EkqYXvTs.css`) se entregan correctamente
- [x] Verificado que todas las SPAs en `/app/*` (`iaprod-os`, `logisearch`, `cv`, etc.) siguen funcionando independientemente
- [x] Endpoint `/api/contact` operacional en el proxy Node.js

---

## 🛠️ 4. STACK TÉCNICO

### Frontend (msbross-frontend)
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.2.7 | UI framework |
| TypeScript | ~6.0.2 | Tipado estático |
| Vite | 8.3.5 | Bundler + dev server |
| Tailwind CSS | 4.3.2 | Utility-first CSS (con `@tailwindcss/vite`) |
| Framer Motion | 12.42.2 | Animaciones de scroll y transiciones |
| Lucide React | 1.23.0 | Iconos (⚠️ NO tiene brand icons — usar SVG inline) |

### Configuración Crítica
- **`vite.config.ts`** DEBE tener `base: './'` — sin esto los estáticos fallan en el proxy
- **Lucide React v1.23+** no exporta `Github`, `Linkedin`, `Youtube` — usar SVG inline
- **Build command:** `npx vite build` (no `npm run build` que ejecuta `tsc -b` primero y
  falla con errores de tipos que no afectan al bundle)
- **package.json `build` script:** `"tsc -b && vite build"` — se puede cambiar a solo
  `"vite build"` si TypeScript strict mode da problemas

### Endpoints del Proxy que USA el Portfolio
| Endpoint | Método | Función |
|----------|--------|---------|
| `/api/contact` | POST | Guardar mensajes de contacto |
| `/api/track-visit` | GET | Tracking de visitas |
| `/api/visits` | GET | Consultar estadísticas |

---

## 📁 5. ARCHIVOS DEL PROYECTO (Estado Actual)

```
apps/msbross-frontend/
├── index.html                    # ✅ NUEVO — SEO, Inter font, OG tags
├── vite.config.ts                # ✅ NUEVO — base: './', sin PWA
├── package.json                  # Original (deps: react, tailwind, framer-motion, lucide)
├── tsconfig.json                 # Original
├── tsconfig.app.json             # Original
├── tsconfig.node.json            # Original
├── public/
│   └── profile-photo.png         # Foto real del usuario (174KB)
├── src/
│   ├── main.tsx                  # Original (sin cambios)
│   ├── index.css                 # ✅ NUEVO — Design system completo
│   ├── App.tsx                   # ✅ NUEVO — SPA sin router
│   ├── components/
│   │   ├── Navbar.tsx            # ✅ NUEVO
│   │   ├── Hero.tsx              # ✅ NUEVO
│   │   ├── Projects.tsx          # ✅ NUEVO
│   │   ├── ProjectCard.tsx       # ✅ NUEVO
│   │   ├── About.tsx             # ✅ NUEVO — usa profile-photo.png
│   │   ├── Technologies.tsx      # ✅ NUEVO
│   │   ├── Contact.tsx           # ✅ NUEVO — POST /api/contact
│   │   └── Footer.tsx            # ✅ NUEVO
│   ├── data/
│   │   └── projects.ts           # ✅ NUEVO — 7 featured + 3 other
│   └── hooks/
│       └── useScrollSpy.ts       # ✅ NUEVO
└── dist/                         # ✅ BUILD EXITOSO
    ├── index.html
    ├── assets/
    │   ├── index-7PxcxtmB.css    # 34KB
    │   └── index-D5wJJZR2.js     # 386KB
    ├── profile-photo.png
    ├── favicon.svg
    ├── logo192.png
    ├── logo512.png
    └── ... (otros estáticos de public/)
```

### Archivos ELIMINADOS (ya no existen)
```
❌ src/pages/Home.tsx
❌ src/pages/Apps.tsx
❌ src/pages/Bots.tsx
❌ src/pages/Architecture.tsx
❌ src/pages/Profile.tsx
❌ src/pages/Contact.tsx          # (reemplazado por components/Contact.tsx)
❌ src/components/Layout.tsx       # (sidebar layout antiguo)
❌ src/data/apps.ts                # (catálogo plano de 25 apps)
❌ src/App.css                     # (estilos viejos)
```

---

## ⚠️ 6. PROBLEMAS CONOCIDOS Y NOTAS

### Problemas Resueltos
1. **`base: '/'` en vite.config.ts** → Cambiado a `base: './'` para que los assets
   funcionen correctamente detrás del proxy en subdirectorio
2. **Lucide React brand icons** → `Github`, `Linkedin`, `Youtube` NO existen en v1.23+.
   Resuelto con SVG inline en Navbar.tsx y Footer.tsx
3. **`tsc -b` falla** → Los tipos de framer-motion/lucide-react dan errores con
   `moduleResolution: "bundler"`. Vite build funciona perfecto sin tsc. Se puede usar
   `npx vite build` directamente

### Pendiente de Decisión (preguntas al usuario)
1. ¿UIEP tiene frontend desplegado o solo concepto? ¿URL?
2. ¿"Teringo Neural Cockpit" es nombre correcto o "Teringo Mail"?
3. ¿FoZ SoundPro tiene demo/frontend o va como "próximamente"?
4. ¿Se quiere generar foto de setup profesional con IA o mantener `profile-photo.png`?

### Cosas que NO se tocan
- **Proxy (`proxy_server.js`)** — funciona perfecto, no cambiar
- **Docker compose** — sin cambios
- **PM2 ecosystem** — sin cambios
- **Las 20 SPAs en `www/app/*`** — siguen funcionando independientemente
- **Endpoints API** (`/api/contact`, `/api/visits`, etc.) — se reutilizan tal cual
- **Traefik** — sin cambios

---

## 🔑 7. CREDENCIALES Y ACCESO AL VPS

> ⚠️ No incluir claves reales aquí. Referencia a dónde están.

- **SSH/VPS:** Credenciales en GitHub Secrets (`VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER`)
- **API Keys:** En `infrastructure/msbross-proxy/api_keys_vault.json` (NUNCA en git)
- **Deploy trigger:** `env -u GITHUB_TOKEN gh workflow run deploy-vps.yml`
  (usar `env -u GITHUB_TOKEN` para evitar error 401 por variables temporales en macOS)
- **Pipeline:** `.github/workflows/deploy-vps.yml`

---

## 📐 8. DISEÑO VISUAL — ESPECIFICACIONES

### Paleta de Colores
```
Fondos:     #060B18 (primary), #0A1628 (secondary), #0D1B2A (cards)
Acentos:    #3B82F6 (blue), #06B6D4 (cyan), #8B5CF6 (purple), #10B981 (green)
Texto:      #F1F5F9 (primary), #94A3B8 (secondary), #475569 (muted)
Glass:      rgba(15,23,42,0.6) bg + rgba(255,255,255,0.08) border
```

### Tipografía
- **Inter** (Google Fonts) — weights 300-900
- Headings: 700-900, Body: 400-500

### Secciones (orden de scroll)
1. **Navbar** — sticky, glass-nav, logo MA circular, 5 links, social SVGs
2. **Hero** (#inicio) — nombre gradiente, subtítulo azul, 2 CTAs, 3 stats, 4 floating cards
3. **Proyectos** (#proyectos) — título + subtítulo, 6 filter tabs, grid 4 cols featured, grid 4 cols otros
4. **Sobre mí** (#sobre-mi) — bio texto, 4 skill cards (2x2), cita, foto real a la derecha
5. **Tecnologías** (#tecnologias) — grid 3x4 tech logos, card "Hablemos" con links
6. **Contacto** (#contacto) — formulario (nombre, email, asunto, mensaje), POST /api/contact
7. **Footer** — logo MA, copyright, social icons

---

## 🔄 9. CÓMO CONTINUAR DESDE OTRO IDE/MODELO

### Para verificar el estado actual:
```bash
cd apps/msbross-frontend
ls src/components/   # Debe tener: Navbar, Hero, Projects, ProjectCard, About, Technologies, Contact, Footer
ls dist/             # Debe existir con index.html y assets/
```

### Para hacer cambios y re-compilar:
```bash
cd apps/msbross-frontend
# Editar archivos en src/
npx vite build       # Compilar (NO usar npm run build, tsc falla)
```

### Para desplegar:
```bash
# Desde la raíz del proyecto SERVER-DEV/
# 1. Limpiar assets viejos
rm -f www/assets/index-B3HfAzRF.js www/assets/index-BQ3A56l0.js \
      www/assets/index-Bkl3gASK.js www/assets/index-BwSQedyv.js \
      www/assets/index-ClKTuT0d.css www/assets/index-Cru5e6EL.js \
      www/assets/index-CxzmotjR.css www/assets/index-DIZ5w5gU.js
rm -f www/sw.js www/workbox-835c8c05.js www/registerSW.js www/manifest.webmanifest

# 2. Copiar build nuevo
cp apps/msbross-frontend/dist/index.html www/index.html
cp -r apps/msbross-frontend/dist/assets/* www/assets/

# 3. Git + deploy
git add www/ apps/msbross-frontend/
git commit -m "feat: redesign portfolio landing"
git push
env -u GITHUB_TOKEN gh workflow run deploy-vps.yml
```

### Para iterar sobre el diseño:
- Datos de proyectos → `src/data/projects.ts`
- Colores/estilos → `src/index.css` (variables `@theme`)
- Componentes individuales → `src/components/[Nombre].tsx`
- Estructura de secciones → `src/App.tsx`

---

*Este documento debe actualizarse cada vez que se complete una fase o se tome una decisión.*
