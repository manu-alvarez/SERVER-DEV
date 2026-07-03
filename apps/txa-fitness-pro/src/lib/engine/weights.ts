export const QUESTION_WEIGHTS: Record<string, number> = {
  sleep_quality: 0.15,
  sleep_duration: 0.12,
  stress_level: 0.14,
  nutrition_quality: 0.13,
  hydration: 0.08,
  exercise_frequency: 0.14,
  exercise_intensity: 0.10,
  recovery_quality: 0.11,
  mental_focus: 0.09,
  social_support: 0.06,
  alcohol_consumption: 0.08,
  smoking: 0.10,
  screen_time: 0.05,
  chronic_pain: 0.12,
  energy_levels: 0.11,
};

export const DIMENSION_MAP: Record<string, string> = {
  sleep_quality: "sleep_hygiene",
  sleep_duration: "sleep_hygiene",
  stress_level: "mental_wellbeing",
  nutrition_quality: "nutrition",
  hydration: "nutrition",
  exercise_frequency: "physical_activity",
  exercise_intensity: "physical_activity",
  recovery_quality: "recovery",
  mental_focus: "mental_wellbeing",
  social_support: "mental_wellbeing",
  alcohol_consumption: "lifestyle",
  smoking: "lifestyle",
  screen_time: "lifestyle",
  chronic_pain: "physical_health",
  energy_levels: "physical_health",
};

export const SEVERITY_THRESHOLD = 0.4;

export const TOTAL_MAX_WEIGHT = Object.values(QUESTION_WEIGHTS).reduce(
  (sum, w) => sum + w,
  0
);

export const INTERACTION_MATRIX: Record<string, Record<string, number>> = {
  sleep_quality: { stress_level: 0.25, exercise_intensity: 0.15 },
  stress_level: { sleep_quality: 0.25, nutrition_quality: 0.18 },
  nutrition_quality: { exercise_frequency: 0.20, recovery_quality: 0.15 },
  exercise_frequency: { sleep_quality: 0.12, nutrition_quality: 0.20 },
};
