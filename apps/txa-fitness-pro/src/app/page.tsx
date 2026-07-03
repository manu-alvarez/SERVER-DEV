"use client";

import { useMemo, useState } from "react";
import { useWorkoutStore, useWorkoutStore as useWorkout } from "@/store/workout-store";
import { ExerciseLogger } from "@/components/coaching/exercise-logger";
import { ExerciseIllustration } from "@/components/coaching/exercise-illustration";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExerciseLog, ExercisePreset, SetLog } from "@/types/domain";
import {
  ChevronRight,
  Clock,
  Dumbbell,
  Play,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Home() {
  const activeProgram = useWorkout((s) => s.activeProgram);
  const currentDayId = useWorkout((s) => s.currentDay);
  const setCurrentDay = useWorkout((s) => s.setCurrentDay);
  const { sessions, startSession, updateSet, completeSession, getTotalVolume } =
    useWorkoutStore();

  const [sessionStarted, setSessionStarted] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const currentDay = useMemo(
    () => activeProgram?.days.find((d) => d.id === currentDayId),
    [activeProgram, currentDayId]
  );

  const todaySession = sessions.find(
    (s) =>
      new Date(s.date).toDateString() === new Date().toDateString() &&
      s.completed
  );

  const isTodayComplete = !!todaySession;

  const weekSessions = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return sessions.filter((s) => {
      const d = new Date(s.date);
      return d >= start && d < end && s.completed;
    });
  }, [sessions]);

  const weekVolume = getTotalVolume(7);
  const weekSessionsCount = weekSessions.length;

  const handleStartSession = () => {
    if (!currentDay) return;
    const exercises: ExerciseLog[] = currentDay.exercises.map((ex) => ({
      id: uuidv4(),
      sessionId: "",
      exerciseName: ex.name,
      targetMuscle: ex.targetMuscle,
      sets: [],
      notes: "",
    }));
    const session = startSession(currentDay.dayName, exercises);
    setActiveSessionId(session.id);
    setSessionStarted(true);
    setStartTime(Date.now());
  };

  const handleCompleteSession = () => {
    if (!activeSessionId || !startTime) return;
    const duration = Math.round((Date.now() - startTime) / 60000);
    completeSession(activeSessionId, duration);
    setSessionStarted(false);
    setActiveSessionId(null);
    setStartTime(null);
  };

  const handleLogSet = (exerciseId: string, setLog: SetLog) => {
    if (!activeSessionId) return;
    updateSet(activeSessionId, exerciseId, setLog);
  };

  const daysRemaining = activeProgram?.days.length ?? 3;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">
            {format(new Date(), "EEEE, d MMMM", { locale: es })}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {isTodayComplete
              ? "Entrenamiento completado 💪"
              : sessionStarted
              ? "Registra tus series"
              : "Listo para entrenar"}
          </p>
        </div>
        <Link
          href="/progress"
          className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700"
        >
          <Trophy className="w-3.5 h-3.5" />
          {weekSessionsCount}/{daysRemaining}
        </Link>
      </div>

      {isTodayComplete && !sessionStarted ? (
        <Card variant="elevated" className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-7 h-7 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-1">
            Buen trabajo hoy
          </h2>
          {todaySession && (
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
              {todaySession.duration} min ·{" "}
              {todaySession.exercises.reduce(
                (sum, e) => sum + e.sets.length,
                0
              )}{" "}
              series totales
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() - 1);
            }}
          >
            Ver resumen
          </Button>
        </Card>
      ) : null}

      {!sessionStarted && !isTodayComplete && (
        <Card variant="bordered" className="p-0">
          <div className="p-4 border-b border-surface-100 dark:border-surface-700">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-surface-900 dark:text-white text-sm">
                Programa: {activeProgram?.name}
              </h2>
              <span className="text-xs text-surface-400">
                {activeProgram?.days.length} días
              </span>
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {activeProgram?.description}
            </p>
          </div>

          <div className="p-4">
            <label className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-2 block">
              Día de entrenamiento
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {activeProgram?.days.map((day) => (
                <button
                  key={day.id}
                  onClick={() => setCurrentDay(day.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    currentDayId === day.id
                      ? "bg-brand-500 text-white"
                      : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700"
                  }`}
                >
                  {day.dayName}
                </button>
              ))}
            </div>

            <div className="space-y-2 mb-4">
              {currentDay?.exercises.map((ex) => (
                <div
                  key={ex.name}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800/50"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center overflow-hidden">
                    <ExerciseIllustration exerciseName={ex.name} size={36} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-surface-900 dark:text-white">
                        {ex.name}
                      </p>
                      {ex.difficulty && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-surface-500 bg-surface-200 dark:text-surface-300 dark:bg-surface-700">
                          {ex.difficulty}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-surface-400">
                      {ex.defaultSets}×{ex.defaultReps} · {ex.restSeconds}s descanso
                    </p>
                    {ex.variation && (
                      <p className="text-[11px] text-brand-600 dark:text-brand-400 mt-0.5">
                        {ex.variation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={handleStartSession} className="w-full">
              <Play className="w-4 h-4" />
              Comenzar Entrenamiento
            </Button>
          </div>
        </Card>
      )}

      {sessionStarted && activeSessionId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
              <Clock className="w-4 h-4" />
              <span>
                {startTime
                  ? `${Math.round((Date.now() - startTime) / 60000)} min`
                  : "0 min"}
              </span>
            </div>
          </div>

          {currentDay?.exercises.map((preset: ExercisePreset) => {
            const session = sessions.find((s) => s.id === activeSessionId);
            const existingLog = session?.exercises.find(
              (e) => e.exerciseName === preset.name
            );
            return (
              <ExerciseLogger
                key={preset.name}
                preset={preset}
                sessionId={activeSessionId}
                onLogSet={handleLogSet}
                existingLog={existingLog}
              />
            );
          })}

          <Button
            onClick={handleCompleteSession}
            className="w-full"
            size="lg"
          >
            <Trophy className="w-5 h-5" />
            Completar Entrenamiento
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="portal-card">
        <Card variant="bordered" className="portal-card-inner p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span className="text-xs text-surface-500 dark:text-surface-400">
              Volumen semanal
            </span>
          </div>
          <p className="text-lg font-bold text-surface-900 dark:text-white">
            {weekVolume.toLocaleString()} kg
          </p>
        </Card>
        </div>
        <div className="portal-card">
        <Card variant="bordered" className="portal-card-inner p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-surface-500 dark:text-surface-400">
              Entrenos esta semana
            </span>
          </div>
          <p className="text-lg font-bold text-surface-900 dark:text-white">
            {weekSessionsCount}/{daysRemaining}
          </p>
        </Card>
        </div>
      </div>
    </div>
  );
}
