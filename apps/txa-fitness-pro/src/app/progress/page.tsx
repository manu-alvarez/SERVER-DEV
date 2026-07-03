"use client";

import { useMemo } from "react";
import { useWorkoutStore } from "@/store/workout-store";
import { Card } from "@/components/ui/card";
import { BarChart3, Dumbbell, Flame, TrendingUp } from "lucide-react";
import { format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";

export default function ProgressPage() {
  const sessions = useWorkoutStore((s) => s.sessions);

  const weeklyData = useMemo(() => {
    const weeks: Record<string, { volume: number; sessions: number; minutes: number }> = {};
    const completed = sessions.filter((s) => s.completed);
    for (const session of completed) {
      const weekStart = format(startOfWeek(new Date(session.date), { weekStartsOn: 1 }), "yyyy-MM-dd");
      if (!weeks[weekStart]) {
        weeks[weekStart] = { volume: 0, sessions: 0, minutes: 0 };
      }
      const volume = session.exercises.reduce(
        (sum, e) => sum + e.sets.reduce((s, st) => s + st.reps * st.weight, 0),
        0
      );
      weeks[weekStart].volume += volume;
      weeks[weekStart].sessions += 1;
      weeks[weekStart].minutes += session.duration;
    }
    return Object.entries(weeks)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8);
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

  const maxVolume = Math.max(...weeklyData.map(([, d]) => d.volume), 1);

  if (totalSessions === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-surface-400" />
        </div>
        <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-1">
          Sin datos aún
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Completa entrenamientos para ver tu progreso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">
          Progreso
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {totalSessions} entrenos completados
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card variant="bordered" className="p-3 text-center">
          <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-surface-900 dark:text-white">
            {totalVolume.toLocaleString()}
          </p>
          <p className="text-[10px] text-surface-400">Vol total (kg)</p>
        </Card>
        <Card variant="bordered" className="p-3 text-center">
          <Dumbbell className="w-4 h-4 text-brand-600 dark:text-brand-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-surface-900 dark:text-white">
            {totalSessions}
          </p>
          <p className="text-[10px] text-surface-400">Entrenos</p>
        </Card>
        <Card variant="bordered" className="p-3 text-center">
          <TrendingUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-surface-900 dark:text-white">
            {totalSessions > 0
              ? Math.round(totalVolume / totalSessions)
              : 0}
          </p>
          <p className="text-[10px] text-surface-400">Promedio/sesión</p>
        </Card>
      </div>

      <Card variant="elevated">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">
          Volumen Semanal (kg)
        </h2>
        <div className="space-y-2">
          {weeklyData.map(([weekKey, data]) => {
            const pct = (data.volume / maxVolume) * 100;
            return (
              <div key={weekKey}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-surface-600 dark:text-surface-300">
                    {format(new Date(weekKey), "d MMM", { locale: es })}
                  </span>
                  <span className="font-medium text-surface-900 dark:text-white">
                    {data.volume.toLocaleString()} kg
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-surface-400 mt-0.5">
                  {data.sessions} sesiones · {data.minutes} min
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {weeklyData.length >= 2 && (
        <Card variant="bordered">
          <h2 className="text-sm font-semibold text-surface-900 dark:text-white mb-2">
            Resumen
          </h2>
          <div className="space-y-1 text-sm text-surface-600 dark:text-surface-300">
            <p>
              Semana actual:{" "}
              <span className="font-medium text-surface-900 dark:text-white">
                {weeklyData[weeklyData.length - 1]?.[1].volume.toLocaleString()} kg
              </span>
            </p>
            <p>
              Semana anterior:{" "}
              <span className="font-medium text-surface-900 dark:text-white">
                {weeklyData.length >= 2
                  ? weeklyData[weeklyData.length - 2]?.[1].volume.toLocaleString()
                  : 0}{" "}
                kg
              </span>
            </p>
            {weeklyData.length >= 2 && (
              <p>
                Tendencia:{" "}
                <span className="font-medium text-brand-600 dark:text-brand-400">
                  {(weeklyData.at(-1)?.[1].volume ?? 0) >=
                  (weeklyData.at(-2)?.[1].volume ?? 0)
                    ? "↑ Crecimiento"
                    : "↓ Requiere atención"}
                </span>
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
