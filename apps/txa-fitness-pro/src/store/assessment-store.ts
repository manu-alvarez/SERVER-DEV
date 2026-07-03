import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AnswerSubmission, DiagnosticReport, WeaknessArea } from "@/types/domain";

interface AssessmentState {
  currentStep: number;
  answers: Record<string, AnswerSubmission>;
  isComplete: boolean;
  report: DiagnosticReport | null;

  setAnswer: (questionId: string, submission: AnswerSubmission) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  completeAssessment: (report: DiagnosticReport) => void;
  resetAssessment: () => void;
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      answers: {},
      isComplete: false,
      report: null,

      setAnswer: (questionId, submission) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: submission },
        })),

      nextStep: () =>
        set((state) => ({
          currentStep: state.currentStep + 1,
        })),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(0, state.currentStep - 1),
        })),

      goToStep: (step) =>
        set({ currentStep: step }),

      completeAssessment: async (report) => {
        set({
          isComplete: true,
          report,
        });

        // Sync to Local Database
        try {
          const weightAns = get().answers["body-metrics"]?.value as any;
          const goalAns = get().answers["primary-goal"]?.value as any as string;
          const levelAns = get().answers["fitness-level"]?.value as any as string;

          const res = await fetch("/app/txafitnesspro/api/assessments/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fitnessLevel: levelAns || 'unknown',
              primaryGoal: goalAns || 'unknown',
              weight: weightAns?.weight ? parseFloat(weightAns.weight) : null,
              targetWeight: weightAns?.targetWeight ? parseFloat(weightAns.targetWeight) : null,
            })
          });

          if (!res.ok) {
            console.error("Failed to sync profile to local DB", await res.text());
          }
        } catch (err) {
          console.error("Failed to sync profile to local DB:", err);
        }
      },

      resetAssessment: () =>
        set({
          currentStep: 0,
          answers: {},
          isComplete: false,
          report: null,
        }),
    }),
    {
      name: "txa-assessment-state",
      partialize: (state) => ({
        answers: state.answers,
        currentStep: state.currentStep,
        isComplete: state.isComplete,
        report: state.report,
      }),
    }
  )
);
