# IA Prod OS — Sistema Operativo Cognitivo y de Producción

Asistente de IA de próxima generación con capacidades de voz, visión continua, herramientas reales, memoria cognitiva y ejecución de código en sandbox. **100% local, sin dependencia de APIs de pago externas.**

## Arquitectura

- **Backend:** FastAPI (Python) — arquitectura puertos/adaptadores
- **Frontend:** React 19 + Vite + Tailwind v4 + Three.js + framer-motion
- **Motor de voz:** Groq Whisper (STT) + edge-tts (TTS)
- **LLM:** Groq (primario) → Ollama local → OpenRouter (fallback)
- **Base de datos:** SQLite (memoria) → PostgreSQL (planificado)
- **Sandbox:** Docker aislado para ejecución de Python

## Despliegue local

```bash
cd apps/iaprod-os

# Backend
cd backend
pip install -r requirements.txt
python main.py   # puerto 8006

# Frontend (en otra terminal)
cd ../frontend
npm install
npm run dev      # puerto 5173
```

## Despliegue con Docker

```bash
cd apps/iaprod-os
docker compose up --build
```

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servicio |
| POST | `/api/login` | Autenticación JWT |
| POST | `/api/register` | Registro de usuario |
| POST | `/api/text-command` | Comando de texto |
| POST | `/api/voice-command` | Comando de voz (archivo de audio) |
| POST | `/api/vision-analyze` | Análisis de imagen |
| POST | `/api/execute-python` | Ejecución en sandbox Docker |
| GET | `/api/models` | Modelos LLM disponibles |
| POST | `/api/clear-memory` | Limpiar memoria de chat |
| POST | `/api/vault-update` | Actualizar vault local |
| GET | `/api/status` | Estado general |

## Seguridad

- Rate limiting con `slowapi` (60 req/min por defecto)
- Autenticación JWT obligatoria
- Ejecución de Python en contenedor Docker aislado (sin red, memoria limitada)
- CORS configurado

## PWA

La aplicación es una PWA instalable. En iOS Safari, usa "Compartir → Añadir a la pantalla de inicio".
