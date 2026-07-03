"use client";
import { v4 as uuidv4 } from "uuid";
import { useAssessmentStore } from "@/store/assessment-store";
import { useCoachingStore } from "@/store/coaching-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mapWeaknessesToModules } from "@/lib/content";
import { CoachingPlan, PlanStatus } from "@/types/domain";
import {
  Activity,
  ChevronRight,
  Dumbbell,
  Heart,
  Moon,
  CheckCircle2,
  Lock,
  Utensils
} from "lucide-react";
import { APP_NAME } from "@/utils/constants";
import Link from "next/link";
import { EXERCISE_DICTIONARY } from "@/lib/workouts/exercise-dictionary";
import Image from "next/image";

const MODULE_ICONS: Record<string, React.ReactNode> = {
  sleep_hygiene: <Moon className="w-6 h-6" />,
  mental_wellbeing: <Heart className="w-6 h-6" />,
  nutrition: <Utensils className="w-6 h-6" />,
  physical_activity: <Dumbbell className="w-6 h-6" />,
  recovery: <Activity className="w-6 h-6" />,
};

const MODULE_COLORS: Record<string, string> = {
  sleep_hygiene: "bg-indigo-500",
  mental_wellbeing: "bg-rose-500",
  nutrition: "bg-emerald-500",
  physical_activity: "bg-brand-500",
  recovery: "bg-blue-500",
};

export default function DashboardPage() {
  const router = useRouter();
  const report = useAssessmentStore((s) => s.report);
  const { plan, setPlan, setActiveModule } = useCoachingStore();
  const [isLoading, setIsLoading] = useState(!plan);

  useEffect(() => {
    if (!report) {
      router.push("/assessment");
      return;
    }

    if (!plan) {
      const generatePlan = async () => {
        const modules = await mapWeaknessesToModules(report.weakAreas, {
          historyScore: 0.6,
          secondaryAreas: ["strength", "flexibility"],
        });

        const newPlan: CoachingPlan = {
          id: uuidv4(),
          userId: report.userId,
          assessmentId: report.id,
          status: PlanStatus.ACTIVE,
          goal: "Optimización general de salud y rendimiento",
          moduleStructure: modules,
          summary: `Plan generado a partir de tu diagnóstico. ${report.weakAreas.length} áreas de mejora identificadas.`,
          lastReviewed: new Date().toISOString(),
        };

        setPlan(newPlan);
        setIsLoading(false);
      };

      generatePlan();
    }
  }, [report, plan, router, setPlan]);

  if (!report) return null;

  if (isLoading) {
    return (
      <main className="min-h-screen py-12 px-4 flex items-center justify-center bg-surface-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mx-auto mb-4" />
          <p className="text-surface-500 font-medium">Diseñando tu Roadmap personalizado...</p>
        </div>
      </main>
    );
  }

  const modules = plan?.moduleStructure ?? [];
  const exercisePreviewList = Object.entries(EXERCISE_DICTIONARY).slice(0, 4); // Preview 4 exercises

  return (
    <main className="min-h-screen bg-surface-50 pb-24">
      <header className="bg-white/80 backdrop-blur-xl border-b border-surface-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-surface-900 tracking-tight">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/ai-nutrition" className="text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 px-4 py-2 rounded-full shadow-lg shadow-brand-500/30 transition-all flex items-center gap-1">
              <span>Nutrición IA</span>
              <span>✨</span>
            </Link>
            <Link href="/assessment" className="text-xs font-bold uppercase tracking-wider text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-2 rounded-full">
              Re-evaluar
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-5 py-8">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-surface-900 mb-2 tracking-tight">
            Mapa de Ruta
          </h1>
          <p className="text-surface-500 text-sm leading-relaxed px-4">
            He diseñado estas Fases basándome en tu perfil. Completa cada fase para desbloquear la siguiente.
          </p>
        </div>

        {/* The Roadmap Journey Line */}
        <div className="relative pl-6 space-y-12 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-brand-500 before:via-brand-300 before:to-surface-200">
          
          {modules.map((mod, i) => {
            const isUnlocked = i === 0; // First phase is unlocked
            const isCompleted = false;
            const colorClass = MODULE_COLORS[mod.moduleType.toLowerCase()] || "bg-brand-500";
            
            return (
              <div key={mod.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Timeline Icon */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface-50 absolute left-0 md:left-1/2 -translate-x-1/2 md:translate-x-0 shrink-0 shadow-sm ${isUnlocked ? colorClass : 'bg-surface-300'} z-10 transition-transform duration-300 group-hover:scale-110`}>
                  {isCompleted ? <CheckCircle2 className="text-white w-5 h-5" /> : (
                    isUnlocked ? (
                      <span className="text-white">{MODULE_ICONS[mod.moduleType.toLowerCase()]}</span>
                    ) : <Lock className="text-white w-4 h-4" />
                  )}
                </div>

                {/* Card */}
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] ml-auto md:ml-0 md:group-even:pl-10 md:group-odd:pr-10">
                  <div 
                    onClick={() => {
                      if(isUnlocked) {
                        setActiveModule(mod);
                        router.push(`/plan?module=${mod.id}`);
                      }
                    }}
                    className={`p-5 rounded-3xl border-2 transition-all duration-300 ${isUnlocked ? 'bg-white border-brand-200 shadow-xl shadow-brand-500/10 cursor-pointer hover:border-brand-400' : 'bg-surface-100 border-surface-200 opacity-75 cursor-not-allowed'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-black uppercase tracking-widest ${isUnlocked ? 'text-brand-600' : 'text-surface-400'}`}>
                        Fase {i + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-surface-900 mb-1 leading-tight">{mod.title}</h3>
                    <p className="text-sm text-surface-500 leading-relaxed mb-4 line-clamp-2">{mod.description}</p>
                    
                    {isUnlocked ? (
                      <Button className="w-full h-12 rounded-xl text-sm font-semibold shadow-md">
                        Comenzar Fase
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <div className="w-full h-12 rounded-xl bg-surface-200 flex items-center justify-center text-surface-500 font-semibold text-sm">
                        Bloqueado
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Preview of Exercises */}
        <div className="mt-16">
          <h2 className="text-xl font-extrabold text-surface-900 mb-6">Tu arsenal de ejercicios</h2>
          <div className="grid grid-cols-2 gap-4">
            {exercisePreviewList.map(([name, data], idx) => (
              <div key={idx} className="bg-white rounded-3xl p-3 border border-surface-200 shadow-sm">
                <div className="aspect-square relative rounded-2xl overflow-hidden bg-surface-100 mb-3">
                  {data.imageUrl ? (
                    <Image src={data.imageUrl} alt={name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Dumbbell className="w-8 h-8 text-surface-300" />
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-surface-900 text-sm px-1 truncate">{name}</h4>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
