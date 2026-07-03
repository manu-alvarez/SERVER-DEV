# Arquitectura del Sistema

## Hybrid-Service Architecture (CAMS Pattern)

### Capas

```
┌─────────────────────────────────────────────┐
│              Presentation Layer              │
│  Next.js 19 App Router + Tailwind CSS v4     │
│  Server Components + Client Components       │
├─────────────────────────────────────────────┤
│              State Management                │
│  Zustand (persist) + Local Storage           │
├─────────────────────────────────────────────┤
│              API Layer                       │
│  Next.js API Routes + GraphQL Resolvers      │
├─────────────────────────────────────────────┤
│           Service Layer (Core Logic)         │
│  ┌──────────────┐  ┌──────────────────┐     │
│  │  Assessment  │  │ Content-Need    │     │
│  │  Engine      │  │ Align Resolver   │     │
│  │  (Scoring)   │  │ (Module Match)   │     │
│  └──────────────┘  └──────────────────┘     │
├─────────────────────────────────────────────┤
│           Data Layer                         │
│  Supabase (PostgreSQL + Auth + RLS)          │
│  Redis (Caching - futuro)                    │
└─────────────────────────────────────────────┘
```

### Assessment Engine Pipeline
1. **Input**: AnswerSubmission[] + UserContext
2. **Weight Matrix**: Ponderación por dimensión
3. **Interaction Check**: Matriz de correlación entre preguntas
4. **Normalization**: Score normalizado [0, 1]
5. **Weakness Detection**: Identificación de áreas bajo umbral
6. **Module Mapping**: Content-Need Alignment Resolver

### Diagrama de Flujo de Datos
```
User → Welcome Screen → Q1 → Q2 → ... → Q12 → Score Engine
  → DiagnosticReport → Weakness Analysis → Module Resolution
  → CoachingPlan → Dashboard → Activity Tracking
```
