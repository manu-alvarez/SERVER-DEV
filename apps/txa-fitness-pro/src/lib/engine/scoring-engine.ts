import {
  AnswerSubmission,
  CorrectedScores,
  DiagnosticReport,
  UserContext,
  WeaknessArea,
  WeightedAnswerMatrix,
} from "@/types/domain";
import {
  DIMENSION_MAP,
  INTERACTION_MATRIX,
  QUESTION_WEIGHTS,
  SEVERITY_THRESHOLD,
} from "./weights";
import { v4 as uuidv4 } from "uuid";

function buildWeightedAnswerMatrix(submissions: AnswerSubmission[]): WeightedAnswerMatrix[] {
  return submissions.map((s) => {
    const weight = QUESTION_WEIGHTS[s.questionId] ?? 0.05;
    return {
      questionId: s.questionId,
      rawValue: s.value,
      weight,
      weightedScore: s.value * weight,
      dimension: DIMENSION_MAP[s.questionId] ?? "general",
    };
  });
}

function calculateScoreAdjustments(
  matrix: WeightedAnswerMatrix[]
): CorrectedScores {
  const answerMap = new Map<string, number>();
  for (const item of matrix) {
    answerMap.set(item.questionId, item.rawValue);
  }

  const dimensionScores: Record<string, number> = {};
  for (const item of matrix) {
    dimensionScores[item.dimension] =
      (dimensionScores[item.dimension] ?? 0) + item.weightedScore;
  }

  let interactionAdjustments = 0;
  for (const [qA, interactions] of Object.entries(INTERACTION_MATRIX)) {
    const valA = answerMap.get(qA);
    if (valA === undefined) continue;
    for (const [qB, coefficient] of Object.entries(interactions)) {
      const valB = answerMap.get(qB);
      if (valB === undefined) continue;
      const negativeImpact = Math.min(valA, valB) / 5;
      interactionAdjustments -= negativeImpact * coefficient;
    }
  }

  const rawScore = matrix.reduce((sum, item) => sum + item.weightedScore, 0);
  const maxPossibleRaw = matrix.reduce(
    (sum, item) => sum + item.weight * 5,
    0
  );
  const totalScore = Math.max(0, rawScore + interactionAdjustments);

  return {
    totalScore: maxPossibleRaw > 0 ? Math.min(1.0, totalScore / maxPossibleRaw) : 0,
    dimensionScores,
    interactionAdjustments,
  };
}

function identifyWeaknesses(corrected: CorrectedScores): WeaknessArea[] {
  const weaknesses: WeaknessArea[] = [];

  const dimensionThresholds: Record<string, { name: string; threshold: number }> = {
    sleep_hygiene: { name: "Higiene del Sueño", threshold: 0.40 },
    mental_wellbeing: { name: "Bienestar Mental", threshold: 0.45 },
    nutrition: { name: "Nutrición", threshold: 0.35 },
    physical_activity: { name: "Actividad Física", threshold: 0.40 },
    recovery: { name: "Recuperación", threshold: 0.35 },
    lifestyle: { name: "Estilo de Vida", threshold: 0.30 },
    physical_health: { name: "Salud Física", threshold: 0.45 },
  };

  const dimensionMaxScores: Record<string, number> = {};
  for (const [qId, dim] of Object.entries(DIMENSION_MAP)) {
    const weight = QUESTION_WEIGHTS[qId] ?? 0.05;
    dimensionMaxScores[dim] = (dimensionMaxScores[dim] ?? 0) + weight * 5;
  }

  for (const [dim, score] of Object.entries(corrected.dimensionScores)) {
    const config = dimensionThresholds[dim];
    if (!config) continue;

    const maxScore = dimensionMaxScores[dim] ?? 5;
    const normalizedScore = maxScore > 0 ? Math.min(1.0, score / maxScore) : 0;
    if (normalizedScore < config.threshold) {
      const gap = config.threshold - normalizedScore;
      const severity = Math.min(5, Math.max(1, Math.ceil(gap * 10)));

      weaknesses.push({
        areaName: config.name,
        severity,
        suggestedMetrics: getSuggestedMetrics(dim),
        justification: generateJustification(dim, normalizedScore, severity),
      });
    }
  }

  return weaknesses.sort((a, b) => b.severity - a.severity);
}

function getSuggestedMetrics(dimension: string): string[] {
  const metricsMap: Record<string, string[]> = {
    sleep_hygiene: ["Horas de sueño", "Calidad percibida (1-10)", "Ciclos completos"],
    mental_wellbeing: ["Nivel de estrés (1-10)", "Estado de ánimo diario", "Minutos de meditación"],
    nutrition: ["Ingesta proteica (g)", "Agua (L)", "Frecuencia de comidas"],
    physical_activity: ["Frecuencia semanal", "Volumen total (sets x reps)", "RPE promedio"],
    recovery: ["HRV (ms)", "Calidad de recuperación (1-10)", "Horas entre sesiones"],
    lifestyle: ["Horas de pantalla", "Consumo de alcohol (Uds/sem)", "Tiempo al aire libre"],
    physical_health: ["Nivel de dolor (0-10)", "Energía matutina (1-10)", "Frecuencia cardiaca basal"],
  };
  return metricsMap[dimension] ?? ["Monitoreo general"];
}

function generateJustification(dim: string, score: number, severity: number): string {
  const templates: Record<string, string[]> = {
    sleep_hygiene: [
      "Los patrones de sueño inconsistentes impactan directamente la recuperación muscular y la función cognitiva.",
      "La deuda de sueño acumulada reduce la síntesis proteica y aumenta el cortisol basal.",
    ],
    mental_wellbeing: [
      "El estrés crónico eleva los niveles de cortisol, inhibiendo la recuperación y promoviendo el catabolismo muscular.",
      "La baja resiliencia mental puede afectar la adherencia al plan de entrenamiento.",
    ],
    nutrition: [
      "Una ingesta nutricional subóptima limita el rendimiento y la capacidad de recuperación.",
      "La falta de micro y macronutrientes esenciales compromete la adaptación al entrenamiento.",
    ],
    physical_activity: [
      "El volumen de actividad física por debajo del umbral mínimo no genera estímulo adaptativo suficiente.",
      "La inconsistencia en el entrenamiento impide la progresión de carga y la sobrecarga progresiva.",
    ],
    recovery: [
      "La recuperación insuficiente entre sesiones aumenta el riesgo de sobreentrenamiento y lesiones.",
      "Sin periodización adecuada de la recuperación, el sistema nervioso central se fatiga crónicamente.",
    ],
    lifestyle: [
      "Hábitos de vida sedentarios o contraproducentes pueden neutralizar los beneficios del entrenamiento.",
      "El equilibrio entre actividad y descanso es fundamental para la adherencia a largo plazo.",
    ],
    physical_health: [
      "Limitaciones físicas existentes requieren modificaciones en la prescripción del ejercicio.",
      "El manejo de condiciones físicas preexistentes es prioritario antes de progresar la carga.",
    ],
  };

  const dimTemplates = templates[dim];
  if (!dimTemplates) return "Área detectada con necesidad de intervención prioritaria.";
  const idx = severity > 3 ? 0 : Math.min(dimTemplates.length - 1, 1);
  return dimTemplates[idx] ?? dimTemplates[0]!;
}

function generatePlanOutlineFromWeaknesses(
  weaknesses: WeaknessArea[],
  context: UserContext
): string[] {
  const moduleMap: Record<string, string> = {
    "Higiene del Sueño": "sleep_hygiene",
    "Bienestar Mental": "mental_wellbeing",
    "Nutrición": "nutrition",
    "Actividad Física": "physical_activity",
    "Recuperación": "recovery",
    "Estilo de Vida": "lifestyle",
    "Salud Física": "physical_health",
  };

  const prioritized: string[] = [];
  const processed = new Set<string>();

  for (const w of weaknesses) {
    const moduleKey = moduleMap[w.areaName];
    if (!moduleKey || processed.has(moduleKey)) continue;
    if (w.severity >= 2) {
      prioritized.push(moduleKey);
      processed.add(moduleKey);
    }
  }

  return prioritized.length > 0
    ? prioritized.slice(0, 3)
    : ["physical_activity", "sleep_hygiene", "nutrition"];
}

export async function processDiagnosticAssessment(
  submissions: AnswerSubmission[],
  initialProfile: UserContext
): Promise<DiagnosticReport> {
  const startTime = Date.now();

  const weightedMatrix = buildWeightedAnswerMatrix(submissions);
  const correctedScores = calculateScoreAdjustments(weightedMatrix);
  const weakAreas = identifyWeaknesses(correctedScores);
  const recommendedModuleKeys = generatePlanOutlineFromWeaknesses(weakAreas, initialProfile);

  const report: DiagnosticReport = {
    id: uuidv4(),
    userId: initialProfile.id,
    assessmentScore: correctedScores.totalScore,
    weakAreas,
    recommendedModules: [],
    completionTimeSeconds: Math.round((Date.now() - startTime) / 1000),
  };

  return report;
}
