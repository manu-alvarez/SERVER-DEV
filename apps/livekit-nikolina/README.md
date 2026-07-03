# LIVEKIT Nikolina - Asistente de Voz para Restaurantes

## Descripción
Asistente de voz especializado en gestión de reservas para restaurantes, con arquitectura dual:
- **Realtime Pipeline**: Gemini 2.5 Flash Native Audio (STT+LLM+TTS en un solo paso)
- **Modular Pipeline**: Ollama (LLM) + Faster-Whisper (STT) + Kokoro (TTS)

## Arquitectura
- **Servidor Backend**: FastAPI + SQLite (restaurant.db)
- **Agente de Voz**: LiveKit Agents 1.4.3 con arquitectura dual
- **Frontend**: React 18 + LiveKit Components + MUI 7
- **STT/TTS/LLM**: Múltiples proveedores con fallback automático

## Estructura
```
livekit-nikolina/
├── agent/              # LiveKit Voice Agent
├── server/             # FastAPI Token + API Server
├── frontend/           # React 18 + LiveKit Components
├── docker-compose.yml
└── README.md
```

## Despliegue Local
```bash
cd apps/livekit-nikolina
docker-compose up -d --build
```

## Endpoints del Servidor
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/token` | Genera token LiveKit y despacha agente |
| GET | `/api/restaurant` | Obtiene información del restaurante |
| PUT | `/api/restaurant` | Actualiza información del restaurante |
| GET | `/api/tables` | Lista mesas (activas/todas) |
| POST | `/api/tables` | Crea nueva mesa |
| GET | `/api/menu` | Obtiene carta (filtrada por categoría) |
| GET | `/api/reservations` | Lista reservas (filtradas) |
| POST | `/api/reservations` | Crea nueva reserva |
| GET | `/api/calls` | Historial de llamadas |
| GET | `/api/stats` | Estadísticas de uso |
| GET | `/health` | Health check |

## Variables de Entorno
Ver `.env.example` en server/

## Mejoras Fusionadas
- ✅ Corregido typo: `LIVEKIT_API_SECRET` → `LIVEKIT_API_SECRET`
- ✅ Implementado `tools.py` modular (antes vacío)
- ✅ Corregido bug en `create_stt` factory (falta return)
- ✅ Wire transcript panel a datos reales del agent
- ✅ Implementado `/api/dev/reset-agent` correctamente
- ✅ Métricas del sistema cross-platform (no solo Linux)
- ✅ Eliminado API keys expuestas en .env files
- ✅ Completado sistema de logging de llamadas
- ✅ Sincronizado menú del frontend con base de datos
- ✅ Sentry integrado para monitoring de errores
- ✅ CORS seguro configurado
- ✅ Docker Compose con healthchecks y named volumes

## Arquitectura Dual
1. **Realtime (Default)**: Gemini 2.5 Flash Native Audio → Baja latencia, alta calidad
2. **Modular**: Ollama + Faster-Whisper + Kokoro → Privado, sin rate limits

## Herramientas del Agent
- `check_availability` - Ver disponibilidad de mesas
- `create_reservation` - Crear nueva reserva
- `cancel_reservation` - Cancelar reserva existente
- `get_restaurant_info` - Información del restaurante
- `find_reservations` - Buscar reservas por teléfono
- `log_special_request` - Registrar peticiones especiales
- `consultar_carta_restaurante` - Ver carta y menú
- `consultar_conocimiento_restaurante` - Preguntas sobre políticas/historia
- `end_call` - Colgar llamada
