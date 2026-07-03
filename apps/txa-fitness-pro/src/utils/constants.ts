export const APP_NAME = "TxaFitnessPro";
export const APP_DESCRIPTION = "Behavioral Change Modeling Platform";

export const ASSESSMENT_QUESTIONS = [
  {
    id: "sleep_quality",
    question: "¿Cómo calificarías la calidad general de tu sueño?",
    options: [
      { id: "very_poor", label: "Muy mala", value: 1 },
      { id: "poor", label: "Mala", value: 2 },
      { id: "fair", label: "Regular", value: 3 },
      { id: "good", label: "Buena", value: 4 },
      { id: "excellent", label: "Excelente", value: 5 },
    ],
    dimension: "sleep_hygiene",
    icon: "moon",
  },
  {
    id: "sleep_duration",
    question: "¿Cuántas horas duermes en promedio por noche?",
    options: [
      { id: "less_5", label: "Menos de 5h", value: 1 },
      { id: "5_6", label: "5-6h", value: 2 },
      { id: "6_7", label: "6-7h", value: 3 },
      { id: "7_8", label: "7-8h", value: 4 },
      { id: "more_8", label: "Más de 8h", value: 5 },
    ],
    dimension: "sleep_hygiene",
    icon: "clock",
  },
  {
    id: "stress_level",
    question: "¿Cómo describirías tu nivel de estrés en las últimas 2 semanas?",
    options: [
      { id: "very_high", label: "Muy alto", value: 1 },
      { id: "high", label: "Alto", value: 2 },
      { id: "moderate", label: "Moderado", value: 3 },
      { id: "low", label: "Bajo", value: 4 },
      { id: "very_low", label: "Muy bajo", value: 5 },
    ],
    dimension: "mental_wellbeing",
    icon: "brain",
  },
  {
    id: "nutrition_quality",
    question: "¿Cómo calificarías la calidad general de tu alimentación?",
    options: [
      { id: "very_poor", label: "Muy mala", value: 1 },
      { id: "poor", label: "Mala", value: 2 },
      { id: "fair", label: "Regular", value: 3 },
      { id: "good", label: "Buena", value: 4 },
      { id: "excellent", label: "Excelente", value: 5 },
    ],
    dimension: "nutrition",
    icon: "apple",
  },
  {
    id: "hydration",
    question: "¿Cuánta agua bebes al día (aproximadamente)?",
    options: [
      { id: "less_1l", label: "Menos de 1L", value: 1 },
      { id: "1_1_5l", label: "1-1.5L", value: 2 },
      { id: "1_5_2l", label: "1.5-2L", value: 3 },
      { id: "2_3l", label: "2-3L", value: 4 },
      { id: "more_3l", label: "Más de 3L", value: 5 },
    ],
    dimension: "nutrition",
    icon: "droplet",
  },
  {
    id: "exercise_frequency",
    question: "¿Con qué frecuencia realizas ejercicio físico a la semana?",
    options: [
      { id: "never", label: "Nunca", value: 1 },
      { id: "1_2", label: "1-2 veces", value: 2 },
      { id: "3", label: "3 veces", value: 3 },
      { id: "4_5", label: "4-5 veces", value: 4 },
      { id: "6_7", label: "6-7 veces", value: 5 },
    ],
    dimension: "physical_activity",
    icon: "dumbbell",
  },
  {
    id: "exercise_intensity",
    question: "¿Cómo describirías la intensidad de tus entrenamientos?",
    options: [
      { id: "none", label: "No entreno", value: 1 },
      { id: "light", label: "Ligera", value: 2 },
      { id: "moderate", label: "Moderada", value: 3 },
      { id: "high", label: "Alta", value: 4 },
      { id: "very_high", label: "Muy alta", value: 5 },
    ],
    dimension: "physical_activity",
    icon: "flame",
  },
  {
    id: "recovery_quality",
    question: "¿Cómo te recuperas después del ejercicio?",
    options: [
      { id: "very_poor", label: "Muy mal", value: 1 },
      { id: "poor", label: "Mal", value: 2 },
      { id: "fair", label: "Regular", value: 3 },
      { id: "good", label: "Bien", value: 4 },
      { id: "excellent", label: "Muy bien", value: 5 },
    ],
    dimension: "recovery",
    icon: "heart",
  },
  {
    id: "energy_levels",
    question: "¿Cómo son tus niveles de energía durante el día?",
    options: [
      { id: "very_low", label: "Muy bajos", value: 1 },
      { id: "low", label: "Bajos", value: 2 },
      { id: "moderate", label: "Moderados", value: 3 },
      { id: "high", label: "Altos", value: 4 },
      { id: "very_high", label: "Muy altos", value: 5 },
    ],
    dimension: "physical_health",
    icon: "zap",
  },
  {
    id: "mental_focus",
    question: "¿Cómo calificarías tu capacidad de concentración y enfoque?",
    options: [
      { id: "very_poor", label: "Muy mala", value: 1 },
      { id: "poor", label: "Mala", value: 2 },
      { id: "fair", label: "Regular", value: 3 },
      { id: "good", label: "Buena", value: 4 },
      { id: "excellent", label: "Excelente", value: 5 },
    ],
    dimension: "mental_wellbeing",
    icon: "target",
  },
  {
    id: "alcohol_consumption",
    question: "¿Con qué frecuencia consumes alcohol?",
    options: [
      { id: "daily", label: "A diario", value: 1 },
      { id: "several_week", label: "Varias veces a la semana", value: 2 },
      { id: "once_week", label: "Una vez a la semana", value: 3 },
      { id: "occasionally", label: "Ocasionalmente", value: 4 },
      { id: "never", label: "Nunca", value: 5 },
    ],
    dimension: "lifestyle",
    icon: "wine",
  },
  {
    id: "chronic_pain",
    question: "¿Experimentas algún dolor o molestia física persistente?",
    options: [
      { id: "severe", label: "Dolor severo y constante", value: 1 },
      { id: "moderate", label: "Dolor moderado frecuente", value: 2 },
      { id: "mild", label: "Molestias leves", value: 3 },
      { id: "rare", label: "Raramente", value: 4 },
      { id: "none", label: "Ninguno", value: 5 },
    ],
    dimension: "physical_health",
    icon: "activity",
  },
];

export const SEVERITY_LABELS: Record<number, string> = {
  1: "Óptimo",
  2: "Leve",
  3: "Moderado",
  4: "Severo",
  5: "Crítico",
};

export const SEVERITY_COLORS: Record<number, string> = {
  1: "bg-green-500",
  2: "bg-yellow-500",
  3: "bg-orange-500",
  4: "bg-red-500",
  5: "bg-red-800",
};
