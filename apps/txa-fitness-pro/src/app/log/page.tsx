"use client";

import { useMemo, useState } from "react";
import { useWorkoutStore } from "@/store/workout-store";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Dumbbell,
  Trophy,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function LogPage() {
  const sessions = useWorkoutStore((s) => s.sessions);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const groupedSessions = useMemo(() => {
    const grouped: Record<string, typeof sessions> = {};
    const completed = sessions.filter((s) => s.completed);
    for (const session of completed) {
      const key = format(new Date(session.date), "yyyy-MM-dd");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(session);
    }
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sessions]);

  const totalSessions = sessions.filter((s) => s.completed).length;
  const totalVolume = sessions
    .filter((s) => s.completed)
    .reduce(
      (sum, s) =>
        sum +
        s.exercises.reduce(
          (exSum, e) =>
            exSum + e.sets.reduce((setSum, st) => setSum + st.reps * st.weight, 0),
          0
        ),
      0
    );

  if (totalSessions === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
          <Dumbbell className="w-8 h-8 text-surface-400" />
        </div>
        <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-1">
          Sin entrenamientos aún
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
          Completa tu primer entrenamiento para verlo aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">
          Historial
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {totalSessions} entrenos · {totalVolume.toLocaleString()} kg totales
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card variant="bordered" className="p-3 text-center">
          <p className="text-lg font-bold text-surface-900 dark:text-white">
            {totalSessions}
          </p>
          <p className="text-[10px] text-surface-400">Entrenos</p>
        </Card>
        <Card variant="bordered" className="p-3 text-center">
          <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
            {totalVolume.toLocaleString()}
          </p>
          <p className="text-[10px] text-surface-400">Vol total (kg)</p>
        </Card>
        <Card variant="bordered" className="p-3 text-center">
          <p className="text-lg font-bold text-surface-900 dark:text-white">
            {sessions
              .filter((s) => s.completed)
              .reduce((sum, s) => sum + s.duration, 0)}
          </p>
          <p className="text-[10px] text-surface-400">Minutos</p>
        </Card>
      </div>

      <div className="space-y-3">
        {groupedSessions.map(([dateKey, daySessions]) => (
          <div key={dateKey}>
            <h3 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2">
              {format(new Date(dateKey), "EEEE, d MMMM", { locale: es })}
            </h3>
            {daySessions.map((session) => (
              <Card
                key={session.id}
                variant="bordered"
                className={cn(
                  "p-4 cursor-pointer transition-colors",
                  expandedId === session.id
                    ? "ring-1 ring-brand-500 dark:ring-brand-400"
                    : ""
                )}
                onClick={() =>
                  setExpandedId(
                    expandedId === session.id ? null : session.id
                  )
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-900 dark:text-white">
                        {session.name}
                      </p>
                      <p className="text-xs text-surface-400">
                        {session.duration} min ·{" "}
                        {session.exercises.reduce(
                          (s, e) => s + e.sets.length,
                          0
                        )}{" "}
                        series
                      </p>
                    </div>
                  </div>
                  {expandedId === session.id ? (
                    <ChevronDown className="w-4 h-4 text-surface-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-surface-400" />
                  )}
                </div>

                {expandedId === session.id && (
                  <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-700 space-y-2">
                    {session.exercises
                      .filter((e) => e.sets.length > 0)
                      .map((exercise) => {
                        const exVolume = exercise.sets.reduce(
                          (s, st) => s + st.reps * st.weight,
                          0
                        );
                        return (
                          <div key={exercise.id} className="text-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-surface-700 dark:text-surface-300">
                                {exercise.exerciseName}
                              </span>
                              <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                                {exVolume} kg
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {exercise.sets.map((set) => (
                                <span
                                  key={set.id}
                                  className="px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-[11px] text-surface-600 dark:text-surface-300"
                                >
                                  {set.reps}×{set.weight} @{set.rpe}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
