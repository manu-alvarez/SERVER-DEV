export type UUID = string;
export type DateTime = string;

export enum PlanStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
  NEEDS_REVIEW = "NEEDS_REVIEW",
}

export enum ModuleType {
  WISDOM = "WISDOM",
  STRENGTH = "STRENGTH",
  CARDIO = "CARDIO",
  SLEEP_HYGIENE = "SLEEP_HYGIENE",
}

export enum ActivityType {
  CALISTHENICS = "CALISTHENICS",
  CARDIO = "CARDIO",
  STRETCH = "STRETCH",
  HABIT_TRACKING = "HABIT_TRACKING",
}

export enum ActivityStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  SKIPPED = "SKIPPED",
  FAILED = "FAILED",
}

export interface User {
  id: UUID;
  email: string;
  createdAt: DateTime;
  lastCompletedAssessment: DateTime | null;
  coachingPlan: CoachingPlan | null;
  metadata: Record<string, unknown>;
}

export interface Assessment {
  id: UUID;
  userId: UUID;
  score: number;
  createdAt: DateTime;
  answers: AnswerSubmission[];
  diagnosticReport: DiagnosticReport | null;
}

export interface AnswerSubmission {
  questionId: string;
  selectedOptionId: string;
  value: number;
  userContext: Record<string, unknown>;
}

export interface CoachingPlan {
  id: UUID;
  userId: UUID;
  assessmentId: UUID;
  status: PlanStatus;
  goal: string;
  moduleStructure: CoachingModule[];
  summary: string;
  lastReviewed: DateTime | null;
}

export interface CoachingModule {
  id: UUID;
  planId: UUID;
  title: string;
  description: string;
  moduleType: ModuleType;
  requiredPrerequisites: string[];
  activities: Activity[];
  baseDifficulty: number;
  difficultyMultiplier: number;
}

export interface Activity {
  id: UUID;
  moduleId: UUID;
  type: ActivityType;
  title: string;
  instructions: string;
  expectedMetrics: Metric[];
  exercises?: ExercisePreset[]; // Structured exercises for physical activities
  videoAssets: Asset[];
  status: ActivityStatus;
  completionLog: ActivityCompletionLog | null;
}

export interface Metric {
  fieldName: string;
  unit: string;
  isCalculated: boolean;
}

export interface Asset {
  url: string;
  type: "video" | "image" | "document";
  title: string;
}

export interface ActivityCompletionLog {
  id: UUID;
  activityId: UUID;
  userId: UUID;
  metrics: Record<string, number>;
  completionStatus: "SUCCESS" | "FAIL" | "PARTIAL";
  completedAt: DateTime;
  notes: string;
}

export interface DiagnosticReport {
  id: UUID;
  userId: UUID;
  assessmentScore: number;
  weakAreas: WeaknessArea[];
  recommendedModules: CoachingModule[];
  completionTimeSeconds: number;
}

export interface WeaknessArea {
  areaName: string;
  severity: number;
  suggestedMetrics: string[];
  justification: string;
}

export interface WeightedAnswerMatrix {
  questionId: string;
  rawValue: number;
  weight: number;
  weightedScore: number;
  dimension: string;
}

export interface CorrectedScores {
  totalScore: number;
  dimensionScores: Record<string, number>;
  interactionAdjustments: number;
}

export interface UserContext {
  id: string;
  age: number;
  gender: "male" | "female" | "unspecified";
  primaryGoal: "hypertrophy" | "strength" | "endurance" | "general_health" | "fat_loss";
  experienceLevel: "beginner" | "intermediate" | "advanced";
  weight?: number;
  targetWeight?: number;
  height?: number; // Added height
  historicalAdherenceScore?: number;
  secondaryAreas?: string[];
}

export interface SetLog {
  id: UUID;
  exerciseLogId: UUID;
  setNumber: number;
  reps: number;
  weight: number;
  rpe: number;
  duration: number;
  completed: boolean;
}

export interface ExerciseLog {
  id: UUID;
  sessionId: UUID;
  exerciseName: string;
  targetMuscle: string;
  sets: SetLog[];
  notes: string;
}

export interface WorkoutSession {
  id: UUID;
  userId: UUID;
  date: DateTime;
  name: string;
  duration: number;
  exercises: ExerciseLog[];
  notes: string;
  completed: boolean;
}

export interface ExercisePreset {
  name: string;
  targetMuscle: string;
  defaultSets: number;
  defaultReps: number;
  restSeconds: number;
  difficulty?: "beginner" | "intermediate" | "advanced" | "expert";
  variation?: string;
}

export interface WorkoutProgram {
  id: UUID;
  name: string;
  description: string;
  days: WorkoutDay[];
}

export interface WorkoutDay {
  id: UUID;
  programId: UUID;
  dayName: string;
  exercises: ExercisePreset[];
}
