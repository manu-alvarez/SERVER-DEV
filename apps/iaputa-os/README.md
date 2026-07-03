# IAPuta OS - Instancia Soberana de IA

## Descripción
Entorno operativo cognitivo con procesamiento LLM, orbe 3D reactivo y memoria persistente.
12 herramientas integradas: visión, búsqueda web, Hotmail, Google Calendar, Telegram, control OS, Python execution, iOS Shortcuts.

## Arquitectura
- **Backend**: FastAPI + Clean Architecture (Ports & Adapters)
- **Frontend**: React 19 + Vite 8 + Three.js + Tailwind
- **LLM**: Groq (primary) → Ollama (local) → OpenRouter (fallback)
- **TTS**: Edge-TTS (es-ES-AlvaroNeural)
- **STT**: Groq Whisper-large-v3

## Estructura
```
iaputa-os/
├── backend/          # FastAPI Clean Architecture
├── frontend/         # React 19 + Three.js
├── docker-compose.yml
└── README.md
```

## Despliegue Local
```bash
cd apps/iaputa-os
docker-compose up -d --build
```

## Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/voice-command` | Audio → STT → LLM → TTS |
| POST | `/api/text-command` | Text → LLM → TTS |
| POST | `/api/vision-analyze` | Image → Vision LLM → TTS |
| POST | `/api/clear-memory` | Purge chat history |
| GET | `/api/status` | System status |
| GET | `/health` | Health check |

## Variables de Entorno
Ver `.env.example` en backend/

## Mejoras Fusionadas
- ✅ CORS seguro (no wildcard en producción)
- ✅ Sentry integrado para monitoring
- ✅ Código duplicado eliminado
- ✅ API key no expuesta en frontend
- ✅ Multi-LLM fallback chain (Groq → Ollama → OpenRouter)
- ✅ Anti-hallucination safeguards
- ✅ Agentic tool loop (hasta 5 iteraciones)
- ✅ Rate limiting con slowapi
- ✅ Type-safe configuration con Pydantic Settings
