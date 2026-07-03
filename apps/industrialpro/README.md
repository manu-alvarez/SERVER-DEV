# IndustrialPro - Task Manager + Pomodoro

## Descripción
Gestor de tareas con temporizador Pomodoro, estadísticas y checklists anidadas.

## Arquitectura
- **Backend**: FastAPI + SQLite (aiosqlite)
- **Frontend**: React 18 + Vite + Tailwind + Zustand
- **Estado**: Zustand con persistencia
- **UI**: Tailwind CSS con Feather icons

## Estructura
```
industrialpro/
├── backend/
│   ├── app.py            # FastAPI con CRUD + stats
│   ├── database.py       # Async SQLite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # TaskList, TaskItem, Timer
│   │   ├── store/        # Zustand store
│   │   └── App.jsx       # Task manager completo
│   ├── package.json
│   └── index.html
└── README.md
```

## Despliegue Local
```bash
cd apps/industrialpro
# Backend
cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && uvicorn app:app --host 0.0.0.0 --port 8000
# Frontend
cd ../frontend && npm install && npm run dev
```

## Endpoints del Backend
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/` | Lista todas las tareas |
| POST | `/api/tasks/` | Crea nueva tarea |
| PUT | `/api/tasks/{id}` | Actualiza tarea |
| DELETE | `/api/tasks/{id}` | Elimina tarea |
| GET | `/api/stats/` | Estadísticas de productividad |

## Características
- ✅ CRUD completo de tareas
- ✅ Temporizador Pomodoro con asignación de tareas
- ✅ Estadísticas de productividad
- ✅ Checklists anidadas
- ✅ Feather icons
- ✅ Tailwind CSS
- ✅ Zustand para estado global

## Mejoras Fusionadas
- ✅ Backend FastAPI funcional con aiosqlite
- ✅ Frontend React con componentes TaskList/TaskItem/Timer
- ✅ API URL corregida a endpoints FastAPI
- ✅ Zustand store implementado
- ✅ Nested checklist support
- ✅ Recurring tasks UI
