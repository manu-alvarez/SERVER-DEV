"use client";

import { motion } from "framer-motion";
import { DiagnosticReport } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ArrowRight, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";

interface ResultsScreenProps {
  report: DiagnosticReport;
  onViewPlan: () => void;
  onRetake: () => void;
}

export function ResultsScreen({ report, onViewPlan, onRetake }: ResultsScreenProps) {
  const scorePercent = Math.round(report.assessmentScore * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
          {report.assessmentScore > 0.6 ? (
            <CheckCircle className="w-10 h-10 text-brand-600" />
          ) : (
            <BarChart3 className="w-10 h-10 text-brand-600" />
          )}
        </div>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
          Diagnóstico Completado
        </h1>
        <p className="text-surface-500 dark:text-surface-400">
          Completado en {report.completionTimeSeconds} segundos
        </p>
      </div>

      <Card variant="elevated" className="mb-6 text-center">
        <p className="text-sm font-medium text-surface-500 mb-2">
          Puntuación Global de Salud
        </p>
        <div className="text-5xl font-bold text-brand-600 mb-4">
          {scorePercent}%
        </div>
        <ProgressBar value={report.assessmentScore * 100} max={100} className="mb-2" />
        <p className="text-sm text-surface-500">
          {report.assessmentScore > 0.7
            ? "Buena base de salud. Áreas específicas para optimizar."
            : report.assessmentScore > 0.4
            ? "Oportunidad significativa de mejora en múltiples áreas."
            : "Se requiere intervención prioritaria en varias dimensiones."}
        </p>
      </Card>

      {report.weakAreas.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-surface-900">
              Áreas de Mejora Detectadas
            </h2>
          </div>

          <div className="space-y-3">
            {report.weakAreas.map((weakness, i) => (
              <motion.div
                key={weakness.areaName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card variant="bordered">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-surface-900">
                      {weakness.areaName}
                    </h3>
                    <SeverityBadge severity={weakness.severity} />
                  </div>
                  <p className="text-sm text-surface-600 mb-3">
                    {weakness.justification}
                  </p>
                  {weakness.suggestedMetrics.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {weakness.suggestedMetrics.map((metric) => (
                        <span
                          key={metric}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg bg-surface-100 text-xs font-medium text-surface-600"
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" onClick={onViewPlan} className="flex-1">
          Ver Plan de Coaching
          <ArrowRight className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="lg" onClick={onRetake}>
          Repetir Diagnóstico
        </Button>
      </div>
    </motion.div>
  );
}
