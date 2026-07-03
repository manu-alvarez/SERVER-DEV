# Perfume Trading ERP - Manual de Despliegue

## Stack
- **Frontend/API:** Next.js 16 (App Router) → **Vercel** (Free Tier)
- **Database:** Supabase PostgreSQL → **Supabase** (Free Tier)
- **PWA:** next-pwa + Service Worker

---

## 1. Base de Datos (Supabase)

### Paso 1: Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) → **Start a new project**
2. Nombre: `perfume-erp`
3. Password de base de datos: guardarla
4. Región: elegir la más cercana (ej: `eu-west-1`)
5. Esperar a que termine la creación (~2 min)

### Paso 2: Ejecutar schema.sql
1. Ve a **SQL Editor** en el dashboard de Supabase
2. Copia el contenido de `schema.sql`
3. Pégalo y ejecuta (esto crea todas las tablas, índices, RPCs y RLS)

### Paso 3: Obtener credenciales
1. Ve a **Project Settings → API**
2. Copia:
   - `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. Aplicación (Vercel)

### Paso 1: Preparar el repositorio
```bash
# Subir a GitHub (u otro git)
cd /Users/manu/Desktop/Teringo/erp
git init
git add .
git commit -m "feat: initial ERP scaffold"
```

Conectar repo a GitHub/GitLab.

### Paso 2: Desplegar en Vercel
1. Ve a [vercel.com](https://vercel.com) → **Add New → Project**
2. Importa el repositorio de GitHub
3. Configura las variables de entorno:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJI...` |

4. Framework: **Next.js** (se detecta automático)
5. Build Command: `npm run build`
6. **Deploy**

### Paso 3: (Opcional) Despliegue local para pruebas
```bash
# Crear .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI..." >> .env.local

# Iniciar dev
npm run dev
# Abrir http://localhost:3000
```

---

## 3. PWA (Instalación en móvil/escritorio)

### Requisitos
- La app debe servirse vía **HTTPS** (Vercel lo provee automático)
- El `manifest.json` ya está configurado en `/public/manifest.json`
- Service Worker en `/public/sw.js` con estrategia network-first

### Íconos PWA
Para generar los iconos PWA, ejecuta:
```bash
# Usando el script de generación
node scripts/generate-icons.js
```
O usa [pwa-asset-generator](https://github.com/onderceylan/pwa-asset-generator):
```bash
npx pwa-asset-generator public/icon.svg public/icons --background "#005A9E"
```

La app se podrá instalar desde Chrome/Edge/Safari:
- **Desktop:** icono de instalar en la barra de direcciones
- **iOS:** Compartir → Añadir a pantalla de inicio
- **Android:** menú → Instalar app

---

## 4. Estructura de Archivos Final

```
erp/
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service Worker
│   └── icons/              # PWA icons
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── products/route.ts
│   │   │   ├── partners/route.ts
│   │   │   ├── trading/route.ts
│   │   │   └── invoices/route.ts
│   │   ├── catalog/page.tsx
│   │   ├── trading/page.tsx
│   │   ├── partners/page.tsx
│   │   ├── invoices/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Dashboard
│   │   └── globals.css
│   ├── components/
│   │   ├── shared/
│   │   │   └── Sidebar.tsx
│   │   └── ui/
│   │       ├── DataGrid.tsx
│   │       ├── Badge.tsx
│   │       ├── Modal.tsx
│   │       └── EmptyState.tsx
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── supabase.ts
│   │   └── supabase-client.ts
│   └── types/
│       └── index.ts
├── schema.sql
├── next.config.mjs
├── package.json
└── DEPLOY.md
```

---

## 5. Roles de Usuario

Configurados en Supabase Auth + RLS:

| Rol | Acceso |
|-----|--------|
| **admin** | CRUD completo en todos los módulos |
| **authenticated** | Lectura en todas las tablas |

Para crear un usuario admin:
```sql
-- En SQL Editor de Supabase:
INSERT INTO auth.users (email, password, role)
VALUES ('admin@perfumeerp.com', 'secure-password', 'admin');
```

---

## 6. Verificación Post-Despliegue

- [ ] Dashboard carga con KPIs
- [ ] Catálogo muestra productos
- [ ] Trading tabla de Offers/Bids
- [ ] Partners CRUD funcional
- [ ] Facturación con cálculos
- [ ] PWA instalable desde el navegador
- [ ] API endpoints responden `curl /api/products`

---

## 7. Costos (Todo Free Tier)

| Servicio | Free Tier | Límites |
|----------|-----------|---------|
| Vercel | ✅ | 100 GB ancho de banda, 6000 build hours/mes |
| Supabase | ✅ | 500 MB BD, 50,000 rows, 2 GB ancho de banda |
| GitHub | ✅ | Repos ilimitados |
| Dominio | Opcional | puedes usar `.vercel.app` gratis |
