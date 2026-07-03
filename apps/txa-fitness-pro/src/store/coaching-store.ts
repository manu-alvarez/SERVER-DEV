import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CoachingPlan, CoachingModule, Activity, ActivityCompletionLog } from "@/types/domain";

interface CoachingState {
  plan: CoachingPlan | null;
  activeModule: CoachingModule | null;
  activityLogs: Record<string, ActivityCompletionLog>;

  setPlan: (plan: CoachingPlan) => void;
  setActiveModule: (module: CoachingModule) => void;
  logActivity: (activityId: string, log: ActivityCompletionLog) => void;
  updateModuleStatus: (moduleId: string, updates: Partial<CoachingModule>) => void;
  resetCoaching: () => void;
}

export const useCoachingStore = create<CoachingState>()(
  persist(
    (set) => ({
      plan: null,
      activeModule: null,
      activityLogs: {},

      setPlan: (plan) => set({ plan }),

      setActiveModule: (mod) => set({ activeModule: mod }),

      logActivity: (activityId, log) =>
        set((state) => ({
          activityLogs: { ...state.activityLogs, [activityId]: log },
        })),

      updateModuleStatus: (moduleId, updates) =>
        set((state) => {
          if (!state.plan) return state;
          return {
            plan: {
              ...state.plan,
              moduleStructure: state.plan.moduleStructure.map((m) =>
                m.id === moduleId ? { ...m, ...updates } : m
              ),
            },
          };
        }),

      resetCoaching: () =>
        set({
          plan: null,
          activeModule: null,
          activityLogs: {},
        }),
    }),
    {
      name: "txa-coaching-state",
      partialize: (state) => ({
        plan: state.plan,
        activeModule: state.activeModule,
        activityLogs: state.activityLogs,
      }),
    }
  )
);
