import { useState, useMemo } from "react";
import { useWorkoutStore } from "@/store/workout-store";
import { ExerciseLog, SetLog } from "@/types/domain";
import { v4 as uuidv4 } from "uuid";

export function useWorkoutSession() {
  const activeProgram = useWorkoutStore((s) => s.activeProgram);
  const currentDayId = useWorkoutStore((s) => s.currentDay);
  const setCurrentDay = useWorkoutStore((s) => s.setCurrentDay);
  const { sessions, startSession, updateSet, completeSession, getTotalVolume } = useWorkoutStore();

  const [sessionStarted, setSessionStarted] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const currentDay = useMemo(
    () => activeProgram?.days.find((d) => d.id === currentDayId),
    [activeProgram, currentDayId]
  );

  const todaySession = useMemo(() => sessions.find(
    (s) => new Date(s.date).toDateString() === new Date().toDateString() && s.completed
  ), [sessions]);

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
  const daysRemaining = activeProgram?.days.length ?? 3;

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

  return {
    activeProgram,
    currentDay,
    currentDayId,
    setCurrentDay,
    sessionStarted,
    activeSessionId,
    startTime,
    isTodayComplete,
    todaySession,
    weekVolume,
    weekSessionsCount,
    daysRemaining,
    sessions,
    handleStartSession,
    handleCompleteSession,
    handleLogSet
  };
}
