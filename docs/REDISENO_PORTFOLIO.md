# 🎯 PROYECTO: Rediseño Total del Portfolio — manuelalvarez.dev

> **Documento de contexto y continuidad.** Contiene todo lo necesario para que cualquier
> modelo, IDE o persona pueda continuar este trabajo exactamente donde se dejó.
>
> **Última actualización:** 2026-10-26T08:45:00+01:00
> **Estado global:** 🟡 EN PROGRESO — Build completado, pendiente verificación visual y deploy

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
- [x] Eliminar archivos antiguos del código fuente (`src/pages/`, `Layout.tsx`, `apps.ts`, `App.css`)
- [x] Limpiar `www/assets/` — eliminados 8 bundles JS/CSS de builds anteriores (~2.6MB basura)
- [ ] Consolidar favicons — hay 5 archivos de ~930KB cada uno que son el mismo PNG (no crítico)
- [x] Limpiar service workers viejos (`sw.js`, `workbox-*.js`, `registerSW.js`, `manifest.webmanifest`)

### FASE 1: Reescritura del Frontend ✅ COMPLETADA (Alineación 100% Mockup)
- [x] Reescribir `index.html` con SEO, Google Fonts Inter
- [x] Reescribir `src/index.css` — design system completo
- [x] Reescribir `src/App.tsx` — SPA fluida
- [x] `src/data/projects.ts` — 7 proyectos estrella + 3 secundarios + 12 tecnologías con SVG oficiales
- [x] Crear componentes:
  - [x] `Navbar.tsx` — sticky glass, scroll spy, monograma MA, enlaces limpios
  - [x] `Hero.tsx` — tipografía gradiente, CTAs con glow, stats, retrato duotone y 5 badges ciber (IA, WEB, APPS, SISTEMAS, </>)
  - [x] `ProjectCard.tsx` — icono cuadrado gradiente, flecha diagonal superior derecha, pill status badge
  - [x] `ProjectShowcase.tsx` — panel interactivo del proyecto seleccionado (Panel 2 del mockup) con canvas de flujo de agentes y terminal
  - [x] `Projects.tsx` — tabs de categoría tipo pill, grid 4 columnas, showcase integrado y "Otros proyectos destacados"
  - [x] `About.tsx` — historia, motivación, 4 skill cards (2x2), cita y consola de infraestructura/workstation de desarrollo
  - [x] `Technologies.tsx` — grid 3x4 (12 logos SVG oficiales), cita y onda luminosa de neón
  - [x] `Contact.tsx` — mockup de smartphone interactivo (Panel 6 del mockup), tarjetas de contacto y formulario POST `/api/contact`
  - [x] `Footer.tsx` — copyright + iconos sociales SVG
- [x] `vite.config.ts` — `base: './'`, sin PWA plugin

### FASE 2: Build ✅ COMPLETADO (3er pase — High-End Mockup Fidelity)
- [x] `npm install` (clean install)
- [x] `npx vite build` → exitoso (391ms)
  - `dist/assets/index-EkqYXvTs.css` (70.7KB, gzip 10.9KB)
  - `dist/assets/index-DzGrvFk6.js` (431.3KB, gzip 131.8KB)
  - `dist/index.html` (1.5KB)
- [x] Copiado a `www/` (index.html + assets/)

### FASE 3: Verificación Visual 🟡 EN PROGRESO (Validación y Deploy)
- [x] Alineación visual de los 6 paneles del mockup de referencia
- [ ] Verificación en vivo en VPS tras deploy
- [ ] Comprobación responsive

### FASE 4: Deploy a Producción 🟡 LISTO PARA DISPARAR
- [x] Assets viejos eliminados de `www/assets/`
- [x] Service workers y manifest eliminados de `www/`
- [x] Build nuevo v3 copiado a `www/` (index.html + assets/)
- [x] Rebase limpio con `origin/main` y resolución de archivos de conflicto iCloud
- [ ] Commit de cambios v3 + push
- [ ] Trigger deploy pipeline: `env -u GITHUB_TOKEN gh workflow run deploy-vps.yml`

### FASE 5: Post-Deploy 🔴 PENDIENTE
- [ ] Verificar que `manuelalvarez.dev` carga el nuevo portfolio
- [ ] Verificar que todas las SPAs en `/app/*` continúan funcionando
- [ ] Probar envío de formulario en `/api/contact`

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
