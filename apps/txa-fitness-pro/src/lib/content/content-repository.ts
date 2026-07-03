import {
  Activity,
  ActivityStatus,
  ActivityType,
  CoachingModule,
  Metric,
  ModuleType,
  WeaknessArea,
} from "@/types/domain";
import { v4 as uuidv4 } from "uuid";

interface ModuleTemplate {
  title: string;
  description: string;
  moduleType: ModuleType;
  tags: string[];
  baseDifficulty: number;
  activities: Activity[];
}

const MODULE_LIBRARY: ModuleTemplate[] = [
  {
    title: "Fundamentos del Sueño Reparador",
    description:
      "Protocolo progresivo para estabilizar el ritmo circadiano y optimizar la recuperación nocturna.",
    moduleType: ModuleType.SLEEP_HYGIENE,
    tags: ["sleep_hygiene", "recovery"],
    baseDifficulty: 2,
    activities: [
      {
        id: uuidv4(),
        moduleId: "",
        type: ActivityType.HABIT_TRACKING,
        title: "Registro de Ciclos de Sueño",
        instructions:
          "Registra hora de acostarte, hora de despertar y calidad percibida (1-10) durante 7 días.",
        expectedMetrics: [
          { fieldName: "sleep_duration_hours", unit: "hours", isCalculated: false },
          { fieldName: "sleep_quality_score", unit: "scale (1-10)", isCalculated: false },
        ],
        videoAssets: [],
        status: ActivityStatus.PENDING,
        completionLog: null,
      },
      {
        id: uuidv4(),
        moduleId: "",
        type: ActivityType.HABIT_TRACKING,
        title: "Rutina Pre-Sueño",
        instructions:
          "Implementa una ventana de desconexión de 30 min sin pantallas antes de dormir.",
        expectedMetrics: [
          { fieldName: "screen_free_minutes", unit: "minutes", isCalculated: false },
        ],
        videoAssets: [],
        status: ActivityStatus.PENDING,
        completionLog: null,
      },
    ],
  },
  {
    title: "Gestión Activa del Estrés",
    description:
      "Técnicas de respiración y mindfulness para reducir el cortisol y mejorar la respuesta adaptativa.",
    moduleType: ModuleType.WISDOM,
    tags: ["mental_wellbeing", "stress"],
    baseDifficulty: 1,
    activities: [
      {
        id: uuidv4(),
        moduleId: "",
        type: ActivityType.HABIT_TRACKING,
        title: "Respiración Diafragmática (5 min)",
        instructions:
          "Realiza 5 minutos de respiración diafragmática (4s inhala, 6s exhala) al despertar y antes de dormir.",
        expectedMetrics: [
          { fieldName: "session_minutes", unit: "minutes", isCalculated: false },
          { fieldName: "compliance", unit: "boolean", isCalculated: false },
        ],
        videoAssets: [],
        status: ActivityStatus.PENDING,
        completionLog: null,
      },
    ],
  },
  {
    title: "Nutrición para la Adaptación",
    description:
      "Pautas nutricionales para optimizar la síntesis proteica, la energía sostenida y la recuperación.",
    moduleType: ModuleType.WISDOM,
    tags: ["nutrition", "recovery"],
    baseDifficulty: 2,
    activities: [
      {
        id: uuidv4(),
        moduleId: "",
        type: ActivityType.HABIT_TRACKING,
        title: "Registro de Ingesta Diaria",
        instructions:
          "Registra tus comidas principales y calcula la ingesta proteica (g) y agua (L) diaria.",
        expectedMetrics: [
          { fieldName: "protein_grams", unit: "g", isCalculated: false },
          { fieldName: "water_liters", unit: "L", isCalculated: false },
        ],
        videoAssets: [],
        status: ActivityStatus.PENDING,
        completionLog: null,
      },
    ],
  },
  {
    title: "Acondicionamiento Físico Base",
    description:
      "Programa progresivo de ejercicios compuestos para desarrollar fuerza funcional y capacidad cardiovascular.",
    moduleType: ModuleType.STRENGTH,
    tags: ["physical_activity", "strength"],
    baseDifficulty: 3,
    activities: [
      {
        id: uuidv4(),
        moduleId: "",
        type: ActivityType.CALISTHENICS,
        title: "Circuito Full Body (Nivel 1)",
        instructions:
          "Circuito completo. Realiza 3 rondas y descansa 60s entre rondas.",
        expectedMetrics: [
          { fieldName: "rounds_completed", unit: "count", isCalculated: false },
          { fieldName: "rpe", unit: "scale (1-10)", isCalculated: false },
        ],
        exercises: [
          { name: "Sentadillas", targetMuscle: "Piernas", defaultSets: 3, defaultReps: 10, restSeconds: 0 },
          { name: "Flexiones", targetMuscle: "Pecho", defaultSets: 3, defaultReps: 8, restSeconds: 0 },
          { name: "Pasos de zancada", targetMuscle: "Piernas", defaultSets: 3, defaultReps: 10, restSeconds: 0 },
          { name: "Plancha", targetMuscle: "Core", defaultSets: 3, defaultReps: 30, restSeconds: 60 },
        ],
        videoAssets: [],
        status: ActivityStatus.PENDING,
        completionLog: null,
      },
    ],
  },
  {
    title: "Recuperación Activa y Flexibilidad",
    description:
      "Protocolos de estiramiento y movilidad para acelerar la recuperación y prevenir lesiones.",
    moduleType: ModuleType.CARDIO,
    tags: ["recovery", "flexibility"],
    baseDifficulty: 1,
    activities: [
      {
        id: uuidv4(),
        moduleId: "",
        type: ActivityType.STRETCH,
        title: "Rutina de Movilidad (15 min)",
        instructions:
          "Realiza la rutina de movilidad articular: círculos de cadera, apertura torácica, estiramiento de isquiotibiales y flexión plantar.",
        expectedMetrics: [
          { fieldName: "duration_minutes", unit: "minutes", isCalculated: false },
          { fieldName: "rom_quality", unit: "scale (1-5)", isCalculated: false },
        ],
        videoAssets: [],
        status: ActivityStatus.PENDING,
        completionLog: null,
      },
    ],
  },
  {
    title: "Optimización del Estilo de Vida",
    description:
      "Ajustes de comportamiento para alinear los hábitos diarios con los objetivos de rendimiento y salud.",
    moduleType: ModuleType.WISDOM,
    tags: ["lifestyle", "habits"],
    baseDifficulty: 1,
    activities: [
      {
        id: uuidv4(),
        moduleId: "",
        type: ActivityType.HABIT_TRACKING,
        title: "Auditoría de Pantallas",
        instructions:
          "Registra tu tiempo de pantalla diario y establece bloques de 45 min sin dispositivos.",
        expectedMetrics: [
          { fieldName: "screen_time_hours", unit: "hours", isCalculated: false },
          { fieldName: "screen_free_blocks", unit: "count", isCalculated: false },
        ],
        videoAssets: [],
        status: ActivityStatus.PENDING,
        completionLog: null,
      },
    ],
  },
];

function calculateDifficultyAdjuster(
  baseDifficulty: number,
  historyScore: number
): number {
  if (historyScore > 0.8) return 1.0;
  if (historyScore > 0.5) return 0.8;
  return 0.6;
}

export async function queryBestFit(
  primaryArea: string,
  secondaryAreas: string[]
): Promise<CoachingModule | null> {
  const tagMap: Record<string, string[]> = {
    sleep_hygiene: ["sleep_hygiene"],
    mental_wellbeing: ["mental_wellbeing", "stress"],
    nutrition: ["nutrition"],
    physical_activity: ["physical_activity", "strength"],
    recovery: ["recovery", "flexibility"],
    lifestyle: ["lifestyle", "habits"],
    physical_health: ["physical_health", "recovery"],
  };

  const primaryTags = tagMap[primaryArea] ?? [primaryArea];

  const scored = MODULE_LIBRARY.map((module) => {
    let score = 0;
    for (const tag of primaryTags) {
      if (module.tags.includes(tag)) score += 10;
    }
    for (const secondary of secondaryAreas) {
      const secTags = tagMap[secondary] ?? [];
      for (const tag of secTags) {
        if (module.tags.includes(tag)) score += 3;
      }
    }
    return { module, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score === 0) return null;

  return {
    ...best.module,
    id: uuidv4(),
    planId: "",
    activities: best.module.activities.map((a) => ({
      ...a,
      id: uuidv4(),
      moduleId: "",
      status: ActivityStatus.PENDING,
      completionLog: null,
    })),
    requiredPrerequisites: [],
    difficultyMultiplier: 1.0,
  };
}

export async function mapWeaknessesToModules(
  weaknesses: WeaknessArea[],
  context: { historyScore: number; secondaryAreas: string[] }
): Promise<CoachingModule[]> {
  const suggestedModules: CoachingModule[] = [];
  const processedKeys = new Set<string>();

  const tagMap: Record<string, string> = {
    "Higiene del Sueño": "sleep_hygiene",
    "Bienestar Mental": "mental_wellbeing",
    "Nutrición": "nutrition",
    "Actividad Física": "physical_activity",
    "Recuperación": "recovery",
    "Estilo de Vida": "lifestyle",
    "Salud Física": "physical_health",
  };

  for (const weakness of weaknesses) {
    const primaryKey = tagMap[weakness.areaName];
    if (!primaryKey || processedKeys.has(primaryKey)) continue;

    if (weakness.severity >= 2) {
      const bestModule = await queryBestFit(primaryKey, context.secondaryAreas);

      if (bestModule) {
        suggestedModules.push({
          ...bestModule,
          difficultyMultiplier: calculateDifficultyAdjuster(
            bestModule.baseDifficulty ?? 2,
            context.historyScore
          ),
        });
        processedKeys.add(primaryKey);
      }
    }
  }

  return suggestedModules.slice(0, 3);
}
