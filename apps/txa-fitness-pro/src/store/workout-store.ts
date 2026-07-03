import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ExerciseLog,
  SetLog,
  WorkoutProgram,
  WorkoutSession,
} from "@/types/domain";
import { DEFAULT_PROGRAMS } from "@/lib/workouts";
import { v4 as uuidv4 } from "uuid";

interface WorkoutState {
  sessions: WorkoutSession[];
  activeProgram: WorkoutProgram | null;
  currentDay: string;

  setActiveProgram: (program: WorkoutProgram) => void;
  setCurrentDay: (dayId: string) => void;
  startSession: (name: string, exercises: ExerciseLog[]) => WorkoutSession;
  updateSet: (sessionId: string, exerciseId: string, setLog: SetLog) => void;
  completeSession: (sessionId: string, duration: number) => void;
  getTodaySession: () => WorkoutSession | null;
  getWeekSessions: () => WorkoutSession[];
  getTotalVolume: (days?: number) => number;
}

function getWeekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeProgram: DEFAULT_PROGRAMS[0] ?? null,
      currentDay: DEFAULT_PROGRAMS[0]?.days[0]?.id ?? "",

      setActiveProgram: (program) => {
        set({
          activeProgram: program,
          currentDay: program.days[0]?.id ?? "",
        });
      },

      setCurrentDay: (dayId) => set({ currentDay: dayId }),

      startSession: (name, exercises) => {
        const session: WorkoutSession = {
          id: uuidv4(),
          userId: "local-user",
          date: new Date().toISOString(),
          name,
          duration: 0,
          exercises,
          notes: "",
          completed: false,
        };
        set((state) => ({
          sessions: [session, ...state.sessions],
        }));
        return session;
      },

      updateSet: (sessionId, exerciseId, setLog) =>
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              exercises: s.exercises.map((e) => {
                if (e.id !== exerciseId) return e;
                const existingIdx = e.sets.findIndex(
                  (st) => st.setNumber === setLog.setNumber
                );
                const newSets =
                  existingIdx >= 0
                    ? e.sets.map((st, i) =>
                        i === existingIdx ? setLog : st
                      )
                    : [...e.sets, setLog];
                return { ...e, sets: newSets };
              }),
            };
          }),
        })),

      completeSession: async (sessionId, duration) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, duration, completed: true }
              : s
          ),
        }));

        // Sync to Local Database
        try {
          const session = get().sessions.find(s => s.id === sessionId);
          if (!session) return;

          const res = await fetch("/app/txafitnesspro/api/workouts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session,
              programId: get().activeProgram?.id || 'none',
              dayId: get().currentDay || 'none',
              duration,
            })
          });

          if (!res.ok) {
            console.error("Failed to sync workout to local DB", await res.text());
          }
        } catch (err) {
          console.error("Failed to sync with local DB:", err);
        }
      },

      getTodaySession: () => {
        const today = new Date().toDateString();
        return (
          get().sessions.find(
            (s) => new Date(s.date).toDateString() === today && !s.completed
          ) ?? null
        );
      },

      getWeekSessions: () => {
        const { start, end } = getWeekRange();
        return get().sessions.filter((s) => {
          const d = new Date(s.date);
          return d >= start && d < end;
        });
      },

      getTotalVolume: (days = 7) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return get()
          .sessions.filter((s) => new Date(s.date) >= cutoff)
          .reduce((total, s) => {
            return (
              total +
              s.exercises.reduce((exTotal, e) => {
                return (
                  exTotal +
                  e.sets.reduce((setTotal, st) => {
                    return setTotal + st.reps * st.weight;
                  }, 0)
                );
              }, 0)
            );
          }, 0);
      },
    }),
    {
      name: "txa-workouts",
      partialize: (state) => ({
        sessions: state.sessions,
        activeProgram: state.activeProgram,
        currentDay: state.currentDay,
      }),
    }
  )
);
