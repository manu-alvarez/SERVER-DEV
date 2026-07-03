export interface ExerciseDetails {
  name: string;
  description: string;
  imageUrl?: string;
  targetMuscle: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  tips: string[];
  instructions: string[];
  commonMistakes: string[];
}

export const EXERCISE_DICTIONARY: Record<string, ExerciseDetails> = {};

export function getExerciseDetails(name: string): ExerciseDetails | undefined {
  return EXERCISE_DICTIONARY[name];
}
