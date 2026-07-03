"use client";

import { useAssessmentStore } from "@/store/assessment-store";
import { useWorkoutStore } from "@/store/workout-store";
import { useThemeStore } from "@/store/theme-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/severity-badge";
import {
  Activity,
  Award,
  BarChart3,
  ChevronRight,
  ClipboardList,
  Moon,
  Sun,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { DEFAULT_PROGRAMS } from "@/lib/workouts";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const report = useAssessmentStore((s) => s.report);
  const { theme, setTheme } = useThemeStore();
  const { sessions, activeProgram, setActiveProgram, getTotalVolume } =
    useWorkoutStore();

  const totalSessions = sessions.filter((s) => s.completed).length;
  const totalVolume = getTotalVolume(30);
  const bestVolumeWeek = 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand-500 flex items-center justify-center text-white text-xl font-bold uppercase">
          {session?.user?.name?.[0] || "U"}
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-surface-900 dark:text-white">
            {session?.user?.name ? session.user.name : "Tu Perfil"}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {totalSessions} entrenos completados
          </p>
        </div>
        <div>
          {session ? (
            <Button size="sm" variant="outline" onClick={() => signOut({ callbackUrl: '/app/txafitnesspro/login' })}>
              Cerrar
            </Button>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="primary">
                Iniciar Sesión
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card variant="elevated" className="p-4">
        <h2 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-3">
          Estadísticas
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-surface-900 dark:text-white">
              {totalSessions}
            </p>
            <p className="text-[10px] text-surface-400">Entrenos</p>
          </div>
          <div className="text-center">
            <Zap className="w-5 h-5 text-brand-600 dark:text-brand-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-surface-900 dark:text-white">
              {totalVolume.toLocaleString()}
            </p>
            <p className="text-[10px] text-surface-400">Vol. Total</p>
          </div>
          <div className="text-center">
            <Award className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-surface-900 dark:text-white">
              {totalSessions > 0
                ? Math.round(totalVolume / totalSessions)
                : 0}
            </p>
            <p className="text-[10px] text-surface-400">Promedio</p>
          </div>
        </div>
      </Card>

      <Card variant="bordered" className="p-4">
        <h2 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-3">
          Programa Activo
        </h2>
        <div className="space-y-2">
          {DEFAULT_PROGRAMS.map((prog) => (
            <button
              key={prog.id}
              onClick={() => setActiveProgram(prog)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                activeProgram?.id === prog.id
                  ? "bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500"
                  : "bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700"
              }`}
            >
              <div>
                <p className="text-sm font-medium text-surface-900 dark:text-white">
                  {prog.name}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {prog.days.length} días · {prog.description}
                </p>
              </div>
              {activeProgram?.id === prog.id && (
                <div className="w-2 h-2 rounded-full bg-brand-500" />
              )}
            </button>
          ))}
        </div>
      </Card>

      <Card variant="bordered" className="p-4">
        <h2 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-3">
          Apariencia
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme("light")}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-colors ${
              theme === "light"
                ? "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 ring-1 ring-brand-500"
                : "bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400"
            }`}
          >
            <Sun className="w-4 h-4" />
            Claro
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-colors ${
              theme === "dark"
                ? "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 ring-1 ring-brand-500"
                : "bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400"
            }`}
          >
            <Moon className="w-4 h-4" />
            Oscuro
          </button>
        </div>
      </Card>

      <Card variant="bordered" className="p-4">
        <h2 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-3">
          Diagnóstico
        </h2>
        {report ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
              <span className="text-sm text-surface-700 dark:text-surface-300">
                Puntuación Global
              </span>
              <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                {Math.round(report.assessmentScore * 100)}%
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {report.weakAreas.slice(0, 3).map((w) => (
                <SeverityBadge key={w.areaName} severity={w.severity} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">
              Realiza el diagnóstico para obtener un plan personalizado.
            </p>
            <Link href="/assessment">
              <Button size="sm" variant="primary">
                <ClipboardList className="w-4 h-4" />
                Hacer Diagnóstico
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
