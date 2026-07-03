# CuentosMagicos AI

> Genera cuentos infantiles personalizados con IA en **texto, imagenes, audio y video**. Una PWA instalable en movil y desktop.

## Caracteristicas

- **Texto**: Historias capituladas adaptadas a la edad del niño
- **Imagenes**: Ilustraciones con consistencia de personajes (DALL-E 3)
- **Audio**: Narracion con voz infantil (OpenAI TTS)
- **Video**: Animaciones de las ilustraciones (Luma Dream Machine)
- **PWA**: Instalable en iOS, Android y desktop con soporte offline
- **Moderacion**: Filtros de seguridad para contenido 100% infantil
- **Cache**: Reutilizacion de prompts para optimizar costos de API

## Requisitos

- **macOS** (no requiere Docker)
- **Python 3.11+**
- **Node.js 20+**
- **PostgreSQL 16** (`brew install postgresql@16`)
- **Redis 7** (`brew install redis`)

## Instalacion Rapida

```bash
# 1. Clonar o acceder al directorio del proyecto
cd CuentosMagicos_AI

# 2. Ejecutar el script de setup
chmod +x setup.sh
./setup.sh

# 3. Revisar y actualizar .env con tus credenciales
nano .env

# 4. Iniciar la aplicacion
chmod +x start.sh
./start.sh
```

La app estara disponible en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Estructura del Proyecto

```
CuentosMagicos_AI/
├── docs/
│   └── ARCHITECTURE.md          # Documentacion tecnica completa
├── database/
│   └── schema.sql               # Esquema PostgreSQL completo
├── backend/                     # FastAPI (Python)
│   ├── requirements.txt
│   └── app/
│       ├── main.py              # Entry point FastAPI
│       ├── api/stories.py       # Endpoints de historias
│       ├── core/
│       │   ├── config.py        # Configuracion (env vars)
│       │   ├── db.py            # Conexion PostgreSQL async
│       │   ├── celery_app.py    # Configuracion Celery
│       │   └── security.py      # Moderacion y guardrails
│       ├── models/
│       │   ├── orm.py           # Modelos SQLAlchemy
│       │   └── schemas.py       # Schemas Pydantic
│       ├── services/
│       │   ├── story_planner.py   # Generacion de texto (GPT-4o)
│       │   ├── image_generation.py # Imagenes (DALL-E 3)
│       │   ├── audio_generation.py # Audio (OpenAI TTS)
│       │   ├── video_generation.py # Video (Luma Dream Machine)
│       │   ├── storage.py         # Supabase Storage
│       │   └── moderation.py      # Filtros de seguridad
│       └── workers/
│           └── tasks.py         # Tareas Celery async
├── frontend/                    # Next.js 15 PWA (React 19)
│   ├── package.json
│   ├── next.config.ts           # Config con PWA + caching
│   ├── public/
│   │   └── manifest.json        # PWA manifest
│   └── app/
│       ├── layout.tsx           # Root layout con PWA meta
│       ├── page.tsx             # Landing page
│       ├── create/page.tsx      # Formulario de creacion
│       ├── stories/[id]/page.tsx # Lector/reproductor
│       └── api/stories/         # BFF routes
│   └── components/
│       ├── StoryForm.tsx        # Formulario interactivo
│       └── StoryPlayer.tsx      # Libro digital interactivo
├── .env.example                 # Variables de entorno plantilla
├── setup.sh                     # Script de instalacion macOS
└── start.sh                     # Script de inicio
```

## Pipeline de IA

```
Usuario introduce parametros
         │
         ▼
┌─────────────────────┐
│ 1. Moderacion input │ ← OpenAI Moderation API
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ 2. Generar texto    │ ← GPT-4o (estructura + capitulos + prompts visuales)
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ 3. Generar imagenes │ ← DALL-E 3 (consistencia con canonical character desc)
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ 4. Generar audio    │ ← OpenAI TTS (voz infantil, velocidad pausada)
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ 5. Generar video    │ ← Luma Dream Machine (image-to-video)
└────────┬────────────┘
         ▼
   Cuento listo ✨
```

## APIs Utilizadas (Free Tiers)

| Servicio | Uso | Free Tier |
|----------|-----|-----------|
| OpenAI GPT-4o | Texto del cuento | $5 credito inicial |
| OpenAI DALL-E 3 | Imagenes | $5 credito inicial |
| OpenAI TTS | Narracion de audio | $5 credito inicial |
| Google Gemini | Alternativa texto | 15 RPM gratis |
| Groq | Alternativa texto | 6000 RPM gratis |
| OpenRouter | Multi-model gratis | Modelos free disponibles |
| Mistral | Alternativa texto | 200M tokens gratis |
| Supabase | DB + Storage | 500MB DB + 1GB storage gratis |

## Comandos Utiles

```bash
# Solo backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Solo frontend
cd frontend && npm run dev

# Celery worker (para procesamiento async)
cd backend && source venv/bin/activate && celery -A app.core.celery_app worker --loglevel=info

# Base de datos (Supabase)
# Las tablas se crean automaticamente en desarrollo via SQLAlchemy
# Para produccion: psql -f database/schema.sql

# Ver logs del backend
tail -f backend/logs/app.log
```

## Seguridad y Moderacion

- **Input moderation**: Todo texto del usuario pasa por OpenAI Moderation API
- **Output moderation**: El texto generado se verifica antes de guardarse
- **Reintento seguro**: Si el contenido es flagged, se regenera con prompts mas estrictos
- **Row Level Security**: Supabase RLS en todas las tablas
- **Signed URLs**: Acceso temporal a archivos privados

## Optimizacion de Costos

- **Prompt caching**: Hash de prompts para reutilizar respuestas identicas
- **Tier-based limits**: Free=3 capitulos, Pro=5, Enterprise=8
- **Modelos eficientes**: GPT-4o para texto, mini-TTS para audio
- **CDN caching**: Supabase Storage con edge caching

## PWA - Instalacion

La aplicacion es una Progressive Web App:

1. Abre http://localhost:3000 en Chrome/Safari
2. Toca "Add to Home Screen" / "Instalar aplicacion"
3. Funciona offline para cuentos ya cargados (service worker cache)

## Licencia

MIT
