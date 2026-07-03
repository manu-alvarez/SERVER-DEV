"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Sparkles, Activity, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAssessmentStore } from "@/store/assessment-store";

export default function AINutritionPage() {
  const router = useRouter();
  const report = useAssessmentStore((s) => s.report);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiPlan, setAiPlan] = useState("");

  const generatePlan = async () => {
    if (!report) {
      setError("No hay diagnóstico previo. Por favor vuelve al inicio y realiza la evaluación.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/app/txafitnesspro/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          diagnosticReport: report
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error al contactar con la Inteligencia Artificial.");
      }

      setAiPlan(data.aiPlan);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface-50 dark:bg-surface-950 pb-24 transition-colors">
      <header className="bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800 sticky top-0 z-10 transition-colors">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 p-2 -ml-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-surface-900 dark:text-surface-50 tracking-tight">Nutrición IA ✨</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8">
        {!aiPlan ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight mb-3 transition-colors">
                Tu Nutricionista Inteligente
              </h1>
              <p className="text-surface-600 dark:text-surface-400 transition-colors">
                Analizamos tus resultados del diagnóstico para crear un plan de nutrición y entrenamiento adaptado a tus necesidades.
              </p>
            </div>

            <Card className="p-6 mb-8 border-brand-200 dark:border-brand-900/50 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm shadow-xl shadow-brand-500/5 transition-colors">
              <div className="flex items-center gap-3 mb-4 text-brand-700 dark:text-brand-400 font-bold transition-colors">
                <Activity className="w-5 h-5" />
                <h3>Generación de Plan</h3>
              </div>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-6 transition-colors">
                Usamos Inteligencia Artificial para evaluar tus datos y generar una pauta completa en segundos. El proceso es totalmente gratuito.
              </p>
              
              <div className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-start gap-2 transition-colors">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <Button 
                  className="w-full h-12 rounded-xl text-base shadow-lg shadow-brand-500/25 relative overflow-hidden group"
                  onClick={generatePlan}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Creando tu plan...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Generar Plan Personalizado
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight transition-colors">Tu Plan Personalizado</h2>
                <Button variant="outline" size="sm" onClick={() => setAiPlan("")} className="rounded-full border-surface-200 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:hover:bg-surface-700 transition-colors">
                    <RefreshCw className="w-4 h-4 mr-2" /> Recalcular
                </Button>
             </div>
             <Card className="p-6 md:p-8 bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 shadow-xl shadow-surface-900/5 dark:shadow-black/20 prose prose-brand prose-headings:font-extrabold prose-h1:text-2xl prose-h1:text-surface-900 dark:prose-h1:text-surface-50 prose-h2:text-xl prose-h2:text-surface-800 dark:prose-h2:text-surface-100 prose-p:text-surface-600 dark:prose-p:text-surface-300 dark:prose-strong:text-brand-300 max-w-none transition-colors">
                <ReactMarkdown>{aiPlan}</ReactMarkdown>
             </Card>
          </div>
        )}
      </div>
    </main>
  );
}
