# Modelo de Datos

## Entidades Principales

### User
- id: UUID (PK)
- email: String (unique)
- createdAt: DateTime
- lastCompletedAssessment: DateTime?
- metadata: JSON

### Assessment
- id: UUID (PK)
- userId: UUID (FK → User)
- score: Float
- answers: AnswerSubmission[]
- createdAt: DateTime

### DiagnosticReport
- id: UUID (PK)
- userId: UUID (FK → User)
- assessmentId: UUID (FK → Assessment)
- assessmentScore: Float [0, 1]
- weakAreas: WeaknessArea[]
- completionTimeSeconds: Int

### WeaknessArea
- areaName: String
- severity: Int [1-5]
- suggestedMetrics: String[]
- justification: String

### CoachingPlan
- id: UUID (PK)
- userId: UUID (FK → User)
- assessmentId: UUID (FK → Assessment)
- status: Enum [DRAFT, ACTIVE, ARCHIVED, NEEDS_REVIEW]
- goal: String
- summary: String
- lastReviewed: DateTime?

### CoachingModule
- id: UUID (PK)
- planId: UUID (FK → CoachingPlan)
- title: String
- description: String
- moduleType: Enum [WISDOM, STRENGTH, CARDIO, SLEEP_HYGIENE]
- baseDifficulty: Int
- difficultyMultiplier: Float

### Activity
- id: UUID (PK)
- moduleId: UUID (FK → CoachingModule)
- type: Enum [CALISTHENICS, CARDIO, STRETCH, HABIT_TRACKING]
- title: String
- instructions: String
- expectedMetrics: Metric[]

### ActivityCompletionLog
- id: UUID (PK)
- activityId: UUID (FK → Activity)
- userId: UUID (FK → User)
- metrics: JSON
- completionStatus: Enum [SUCCESS, FAIL, PARTIAL]
- completedAt: DateTime

## Scoring Engine Weights
Ver `src/lib/engine/weights.ts` para la matriz completa de:
- QUESTION_WEIGHTS: ponderación por pregunta
- DIMENSION_MAP: mapeo pregunta → dimensión
- INTERACTION_MATRIX: coeficientes de interacción entre dimensiones
- SEVERITY_THRESHOLD: umbral de detección de debilidades
