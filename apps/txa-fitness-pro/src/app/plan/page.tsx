"use client";
import { v4 as uuidv4 } from "uuid";


import { useCoachingStore } from "@/store/coaching-store";
import { useWorkoutStore } from "@/store/workout-store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity as ActivityIcon, ArrowLeft, CheckCircle, Play } from "lucide-react";
import { ActivityStatus, Activity } from "@/types/domain";
import { APP_NAME } from "@/utils/constants";
import Link from "next/link";

export default function PlanPage() {
  const router = useRouter();
  const { plan, activeModule, logActivity, activityLogs } = useCoachingStore();
  const setActiveProgram = useWorkoutStore((s) => s.setActiveProgram);
  const [metrics, setMetrics] = useState<Record<string, Record<string, string>>>({});

  if (!plan || !activeModule) {
    return (
      <main className="min-h-screen py-12 px-4 flex flex-col items-center justify-center">
        <p className="text-surface-500 mb-4">No hay un módulo activo seleccionado.</p>
        <Link href="/dashboard" className="text-brand-600 font-medium hover:text-brand-700">
          Volver al Dashboard
        </Link>
      </main>
    );
  }

  const handleCompleteActivity = (activityId: string) => {
    const rawMetrics = metrics[activityId] || {};
    const parsedMetrics: Record<string, number> = {};
    for (const [key, val] of Object.entries(rawMetrics)) {
      parsedMetrics[key] = parseFloat(val) || 0;
    }
    
    logActivity(activityId, {
      id: uuidv4(),
      activityId,
      userId: plan.userId,
      metrics: parsedMetrics,
      completionStatus: "SUCCESS",
      completedAt: new Date().toISOString(),
      notes: "",
    });
  };

  const handleMetricChange = (activityId: string, fieldName: string, value: string) => {
    setMetrics(prev => ({
      ...prev,
      [activityId]: {
        ...(prev[activityId] || {}),
        [fieldName]: value
      }
    }));
  };

  const handleStartWorkout = (activity: Activity) => {
    let exercises = activity.exercises || [];

    if (exercises.length === 0) {
      // Fallback heurístico si la actividad no tiene ejercicios estructurados (legacy)
      const exercisesText = activity.instructions.split(/:|\./)[1] || activity.instructions;
      const parts = exercisesText.split(',').map(p => p.trim()).filter(Boolean);
      
      exercises = parts.map((part) => {
        const match = part.match(/(\d+)\s*(s|segundos|m|minutos|rondas|repeticiones|reps)?\s+(.+)/i);
        if (match && match[3]) {
          return {
            name: match[3].charAt(0).toUpperCase() + match[3].slice(1),
            targetMuscle: "Full Body",
            defaultSets: 3,
            defaultReps: match[1] ? parseInt(match[1]) : 10,
            restSeconds: 60,
          };
        }
        return {
          name: part.charAt(0).toUpperCase() + part.slice(1),
          targetMuscle: "Full Body",
          defaultSets: 3,
          defaultReps: 10,
          restSeconds: 60,
        };
      });

      // Si no detectó nada, poner un genérico
      if (exercises.length === 0) {
        exercises.push({
          name: "Circuito Dinámico",
          targetMuscle: "Full Body",
          defaultSets: 3,
          defaultReps: 10,
          restSeconds: 60,
        });
      }
    }

    const programId = `ai-prog-${uuidv4().slice(0,8)}`;
    const dayId = `ai-day-${uuidv4().slice(0,8)}`;

    const program = {
      id: programId,
      name: activity.title,
      description: activity.instructions,
      days: [
        {
          id: dayId,
          programId,
          dayName: "Sesión IA",
          exercises,
        }
      ]
    };

    setActiveProgram(program);
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-surface-500 hover:text-surface-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <ActivityIcon className="w-6 h-6 text-brand-600" />
            <span className="font-bold text-surface-900">{APP_NAME}</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <span className="text-sm font-medium text-brand-600 mb-2 block">
            Módulo Activo
          </span>
          <h1 className="text-2xl font-bold text-surface-900 mb-2">
            {activeModule.title}
          </h1>
          <p className="text-surface-500">{activeModule.description}</p>
        </div>

        <div className="space-y-4">
          {activeModule.activities.map((activity) => {
            const isCompleted =
              activityLogs[activity.id]?.completionStatus === "SUCCESS";

            return (
              <Card key={activity.id} variant="bordered">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      isCompleted
                        ? "bg-green-50 text-green-600"
                        : "bg-brand-50 text-brand-600"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-surface-900">
                        {activity.title}
                      </h3>
                      <span className="text-xs font-medium text-surface-400 capitalize">
                        {activity.type.toLowerCase().replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      {activity.instructions}
                    </p>

                    {!isCompleted && activity.expectedMetrics.length > 0 && (
                      <div className="flex flex-col gap-3 mb-4 mt-2 bg-surface-100/50 p-4 rounded-xl border border-surface-100">
                        <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Registra tus métricas</p>
                        {activity.expectedMetrics.map((metric) => (
                          <div key={metric.fieldName} className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-surface-700">
                              {metric.fieldName.replace('_', ' ')} <span className="text-surface-400 font-normal">({metric.unit})</span>
                            </label>
                            <input
                              type="text"
                              value={metrics[activity.id]?.[metric.fieldName] || ""}
                              onChange={(e) => handleMetricChange(activity.id, metric.fieldName, e.target.value)}
                              placeholder={`Ej: ${metric.fieldName === 'rpe' ? '8' : '3'}`}
                              className="px-3 py-2 border border-surface-200 rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all bg-white"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {isCompleted && activityLogs[activity.id]?.metrics && Object.keys(activityLogs[activity.id]?.metrics || {}).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3 mt-2">
                        {Object.entries(activityLogs[activity.id]?.metrics || {}).map(([key, value]) => (
                          <span
                            key={key}
                            className="inline-flex items-center px-2 py-1 rounded-lg bg-green-50 text-xs font-medium text-green-700 border border-green-100"
                          >
                            {key.replace('_', ' ')}: {value as React.ReactNode}
                          </span>
                        ))}
                      </div>
                    )}

                    {!isCompleted && (
                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleStartWorkout(activity)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Empezar Entrenamiento
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompleteActivity(activity.id)}
                        >
                          Marcar Manualmente
                        </Button>
                      </div>
                    )}

                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Completada
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
