"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, Brain, Heart, LineChart } from "lucide-react";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto text-center"
    >
      <div className="mb-8">
        <div className="w-20 h-20 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-500/25">
          <Activity className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-surface-900 dark:text-white mb-3">
          Diagnóstico de Salud Integral
        </h1>
        <p className="text-lg text-surface-500 dark:text-surface-400 max-w-lg mx-auto">
          Responde 12 preguntas sobre tus hábitos y obtén un plan de coaching
          personalizado basado en ciencia.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            icon: Brain,
            title: "Análisis Multi-dimensional",
            desc: "Evaluamos 7 dimensiones clave de tu salud",
          },
          {
            icon: LineChart,
            title: "Scoring Ponderado",
            desc: "Algoritmo de IA con detección de correlaciones",
          },
          {
            icon: Heart,
            title: "Plan Personalizado",
            desc: "Módulos de intervención adaptados a ti",
          },
        ].map((feature) => (
          <Card key={feature.title} variant="bordered" className="p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mx-auto mb-3">
              <feature.icon className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="text-sm font-semibold text-surface-900 mb-1">
              {feature.title}
            </h3>
            <p className="text-xs text-surface-500">{feature.desc}</p>
          </Card>
        ))}
      </div>

      <div className="text-surface-500 text-sm mb-8">
        <p>⏱️ Tiempo estimado: 3-5 minutos</p>
      </div>

      <Button size="lg" onClick={onStart} className="w-full sm:w-auto">
        Comenzar Diagnóstico
      </Button>
    </motion.div>
  );
}
