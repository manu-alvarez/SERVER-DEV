"use client";
import { v4 as uuidv4 } from "uuid";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAssessmentStore } from "@/store/assessment-store";
import { processDiagnosticAssessment } from "@/lib/engine/scoring-engine";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

/* ─── Age-Range Cards ─── */
const AGE_RANGES = [
  { id: "18-29", label: "18 – 29", image: "/app/txafitnesspro/images/age-18-29.png", subtitle: "Energía y fundamentos" },
  { id: "30-39", label: "30 – 39", image: "/app/txafitnesspro/images/age-30-39.png", subtitle: "Equilibrio y fuerza" },
  { id: "40-49", label: "40 – 49", image: "/app/txafitnesspro/images/age-40-49.png", subtitle: "Flexibilidad y bienestar" },
  { id: "50+",   label: "50+",     image: "/app/txafitnesspro/images/age-50-plus.png", subtitle: "Vitalidad y cuidado" },
];

/* ─── Physical Data (Personal Info) ─── */
type PersonalInfo = {
  weight: string;
  height: string;
  gender: "male" | "female" | "unspecified";
};

/* ─── Questions (Concrete Answers mapped to 1-5 for scoring engine) ─── */
const QUESTIONS = [
  { 
    id: "sleep_quality",       
    text: "¿Cómo describirías la calidad de tu sueño últimamente?", 
    emoji: "🌙",
    options: [
      { text: "Pésima, me despierto muy cansado/a", value: 1 },
      { text: "Mala, me cuesta mucho conciliar el sueño", value: 2 },
      { text: "Regular, algunos días bien y otros mal", value: 3 },
      { text: "Buena, suelo dormir del tirón", value: 4 },
      { text: "Excelente, profundo y súper reparador", value: 5 }
    ]
  },
  { 
    id: "sleep_duration",      
    text: "¿Cuántas horas en promedio duermes cada noche?",                      
    emoji: "⏰",
    options: [
      { text: "Menos de 5 horas", value: 1 },
      { text: "Entre 5 y 6 horas", value: 2 },
      { text: "Entre 6 y 7 horas", value: 3 },
      { text: "Entre 7 y 8 horas", value: 4 },
      { text: "Más de 8 horas", value: 5 }
    ]
  },
  { 
    id: "stress_level",        
    text: "¿Qué nivel de estrés has experimentado recientemente?",               
    emoji: "🧘",
    options: [
      { text: "Extremo, me siento abrumado/a constantemente", value: 1 },
      { text: "Alto, bastantes picos de ansiedad", value: 2 },
      { text: "Moderado, lo normal del día a día", value: 3 },
      { text: "Bajo, me siento bastante tranquilo/a", value: 4 },
      { text: "Muy bajo, total paz y control", value: 5 }
    ]
  },
  { 
    id: "nutrition_quality",   
    text: "¿Cómo describirías tu alimentación diaria?",            
    emoji: "🥗",
    options: [
      { text: "Mucha comida rápida y ultraprocesados", value: 1 },
      { text: "Desordenada, como lo que pillo sin fijarme", value: 2 },
      { text: "Normal, intento equilibrar pero me salto dietas", value: 3 },
      { text: "Saludable, priorizo comida real y verduras", value: 4 },
      { text: "Excelente, macronutrientes medidos y limpios", value: 5 }
    ]
  },
  { 
    id: "hydration",           
    text: "¿Cuánta agua bebes en promedio al día?",                              
    emoji: "💧",
    options: [
      { text: "Menos de 3 vasos al día", value: 1 },
      { text: "Aproximadamente 1 Litro", value: 2 },
      { text: "Entre 1.5 y 2 Litros", value: 3 },
      { text: "Entre 2 y 3 Litros", value: 4 },
      { text: "Más de 3 Litros", value: 5 }
    ]
  },
  { 
    id: "exercise_frequency",  
    text: "¿Cuántos días a la semana realizas actividad física?",                
    emoji: "🏋️",
    options: [
      { text: "Ninguno, vida totalmente sedentaria", value: 1 },
      { text: "1 a 2 días", value: 2 },
      { text: "3 días a la semana", value: 3 },
      { text: "4 días a la semana", value: 4 },
      { text: "5 o más días (Muy activo)", value: 5 }
    ]
  },
  { 
    id: "exercise_intensity",  
    text: "Cuando entrenas, ¿qué tan intenso es tu esfuerzo?",          
    emoji: "🔥",
    options: [
      { text: "Cero, no entreno", value: 1 },
      { text: "Muy ligero (Paseos suaves, estiramientos)", value: 2 },
      { text: "Moderado (Sudo pero puedo hablar)", value: 3 },
      { text: "Intenso (Me cuesta hablar, levanto pesado)", value: 4 },
      { text: "Muy intenso (Al fallo, máxima exigencia)", value: 5 }
    ]
  },
  { 
    id: "recovery_quality",    
    text: "¿Cómo sientes tu cuerpo después de días agotadores?",             
    emoji: "💪",
    options: [
      { text: "Pésimo, me duelen las articulaciones días enteros", value: 1 },
      { text: "Malo, tardo mucho en recuperar la energía", value: 2 },
      { text: "Regular, me recupero pero con agujetas", value: 3 },
      { text: "Bien, al día siguiente estoy operativo/a", value: 4 },
      { text: "Excelente, recuperación ultra rápida", value: 5 }
    ]
  },
  { 
    id: "mental_focus",        
    text: "¿Cómo calificarías tu capacidad de concentración diaria?",            
    emoji: "🎯",
    options: [
      { text: "Neblina mental constante, imposible enfocarme", value: 1 },
      { text: "Muy disperso/a, me distraigo rápido", value: 2 },
      { text: "Normal, tengo picos y bajones", value: 3 },
      { text: "Buena, logro sacar el trabajo sin problema", value: 4 },
      { text: "Foco láser, productividad al máximo", value: 5 }
    ]
  },
  { 
    id: "chronic_pain",        
    text: "¿Sufres de algún dolor crónico o molestia recurrente?",               
    emoji: "🩹",
    options: [
      { text: "Sí, severo y diario (espalda, rodillas...)", value: 1 },
      { text: "Frecuente, me molesta varias veces por semana", value: 2 },
      { text: "Ocasional, de vez en cuando alguna molestia", value: 3 },
      { text: "Rara vez, solo si hago un mal movimiento", value: 4 },
      { text: "Nunca, cuerpo 100% libre de dolor", value: 5 }
    ]
  },
  { 
    id: "energy_levels",       
    text: "¿Cómo es tu nivel de energía general a lo largo del día?",            
    emoji: "⚡",
    options: [
      { text: "Siempre agotado/a desde que me levanto", value: 1 },
      { text: "Bajo, necesito café para sobrevivir", value: 2 },
      { text: "Inestable, sufro el bajón de después de comer", value: 3 },
      { text: "Estable y bueno durante todo el día", value: 4 },
      { text: "Lleno/a de energía inagotable", value: 5 }
    ]
  },
];

type Phase = "welcome" | "personal_info" | "quiz" | "processing";

export default function AssessmentPage() {
  const router = useRouter();
  const {
    currentStep,
    answers,
    setAnswer,
    nextStep,
    prevStep,
    completeAssessment,
    resetAssessment,
  } = useAssessmentStore();

  const [phase, setPhase] = useState<Phase>("welcome");
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({ weight: "", height: "", gender: "unspecified" });

  useEffect(() => {
    if (useAssessmentStore.getState().isComplete) resetAssessment();
  }, [resetAssessment]);

  const handleAgeSelect = useCallback((ageId: string) => {
    setSelectedAge(ageId);
    setTimeout(() => {
      resetAssessment();
      setPhase("personal_info");
    }, 300);
  }, [resetAssessment]);

  const submitPersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setPhase("quiz");
  };

  const handleSelect = useCallback((value: number) => {
    const question = QUESTIONS[currentStep];
    if (!question) return;
    setAnswer(question.id, {
      questionId: question.id,
      selectedOptionId: value.toString(),
      value,
      userContext: { ageRange: selectedAge },
    });
    if (currentStep < QUESTIONS.length - 1) {
      setTimeout(() => nextStep(), 350);
    }
  }, [currentStep, selectedAge, setAnswer, nextStep]);

  const handleSubmit = useCallback(async () => {
    setPhase("processing");

    const ageMap: Record<string, number> = { "18-29": 24, "30-39": 35, "40-49": 45, "50+": 55 };
    const initialProfile = {
      id: uuidv4(),
      age: ageMap[selectedAge ?? "30-39"] ?? 30,
      gender: personalInfo.gender,
      weight: personalInfo.weight ? parseFloat(personalInfo.weight) : undefined,
      height: personalInfo.height ? parseFloat(personalInfo.height) : undefined,
      primaryGoal: "general_health" as const,
      experienceLevel: "intermediate" as const,
      historicalAdherenceScore: 0.6,
      secondaryAreas: [],
    };

    const answerArray = Object.values(answers);
    const report = await processDiagnosticAssessment(answerArray, initialProfile);
    completeAssessment(report);

    setTimeout(() => router.push("/dashboard"), 1500);
  }, [selectedAge, personalInfo, answers, completeAssessment, router]);

  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
  const currentQuestion = QUESTIONS[currentStep];
  const currentValue = currentQuestion ? answers[currentQuestion.id]?.value : undefined;

  /* ════ PHASE 1: Welcome ════ */
  if (phase === "welcome") {
    return (
      <main className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
        <header className="h-16 flex items-center justify-center border-b border-surface-200/50 dark:border-surface-800/50 bg-white/60 dark:bg-surface-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-surface-900 dark:text-white text-base tracking-tight">TxaFitness</span>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 max-w-lg mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-surface-900 dark:text-white uppercase tracking-tight leading-tight mb-3">
              Plan de Entrenamiento
              <br />
              <span className="text-brand-500">Personalizado</span>
            </h1>
            <p className="text-sm uppercase tracking-widest text-surface-400 dark:text-surface-500 font-semibold">
              Elige tu rango de edad
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 w-full mb-10">
            {AGE_RANGES.map((range, i) => (
              <motion.button
                key={range.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAgeSelect(range.id)}
                className={`relative overflow-hidden rounded-3xl aspect-[3/4] group cursor-pointer transition-all duration-300 ${
                  selectedAge === range.id
                    ? "ring-4 ring-brand-500 ring-offset-2 dark:ring-offset-surface-950"
                    : "ring-1 ring-surface-200 dark:ring-surface-700 shadow-xl shadow-surface-200/50 dark:shadow-none"
                }`}
              >
                <Image src={range.image} alt={`Edad ${range.label}`} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 250px" priority={i < 2} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col items-start text-left">
                  <p className="text-white font-black text-xl leading-tight mb-1">{range.label}</p>
                  <p className="text-white/80 text-sm font-medium">{range.subtitle}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  /* ════ PHASE 1.5: Personal Info ════ */
  if (phase === "personal_info") {
    return (
      <main className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
        <header className="h-16 flex items-center px-4 border-b border-surface-200/50 bg-white/60 backdrop-blur-xl">
           <button onClick={() => setPhase("welcome")} className="p-3 -ml-3 text-surface-400 hover:text-surface-900 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
        </header>
        <div className="flex-1 max-w-lg w-full mx-auto px-6 py-10">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-bold text-surface-900 mb-2">Datos Físicos</h2>
            <p className="text-surface-500 mb-8">Necesitamos estos datos para calcular tus métricas y adaptar el plan de manera exacta.</p>

            <form onSubmit={submitPersonalInfo} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-surface-700 mb-2">Género Biológico</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setPersonalInfo({...personalInfo, gender: 'male'})} className={`p-4 rounded-2xl border-2 font-semibold transition-all ${personalInfo.gender === 'male' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 bg-white text-surface-600'}`}>Masculino</button>
                  <button type="button" onClick={() => setPersonalInfo({...personalInfo, gender: 'female'})} className={`p-4 rounded-2xl border-2 font-semibold transition-all ${personalInfo.gender === 'female' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 bg-white text-surface-600'}`}>Femenino</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-surface-700 mb-2">Peso Actual (kg)</label>
                <input required type="number" step="0.1" value={personalInfo.weight} onChange={(e) => setPersonalInfo({...personalInfo, weight: e.target.value})} placeholder="Ej: 75.5" className="w-full p-4 rounded-2xl border-2 border-surface-200 bg-white text-lg focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-surface-700 mb-2">Altura (cm)</label>
                <input required type="number" value={personalInfo.height} onChange={(e) => setPersonalInfo({...personalInfo, height: e.target.value})} placeholder="Ej: 178" className="w-full p-4 rounded-2xl border-2 border-surface-200 bg-white text-lg focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 outline-none transition-all" />
              </div>

              <div className="pt-6">
                <Button type="submit" size="lg" className="w-full h-14 text-lg rounded-2xl">
                  Siguiente paso
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    );
  }

  /* ════ PHASE 3: Processing ════ */
  if (phase === "processing") {
    return (
      <main className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
            <div className="absolute inset-3 rounded-full bg-brand-50 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-brand-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-surface-900 mb-3">Analizando tu perfil...</h2>
          <p className="text-surface-500 max-w-sm mx-auto leading-relaxed">
            Nuestro motor de IA está calculando tus métricas y diseñando el plan de entrenamiento perfecto.
          </p>
        </motion.div>
      </main>
    );
  }

  /* ════ PHASE 2: Quiz ════ */
  return (
    <main className="min-h-screen bg-surface-50 flex flex-col">
      <header className="h-16 border-b border-surface-200/50 flex items-center px-4 bg-white/60 backdrop-blur-xl">
        <button onClick={() => { if (currentStep > 0) prevStep(); else setPhase("personal_info"); }} className="p-3 -ml-2 text-surface-400 hover:text-surface-900 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 mx-4">
          <div className="h-2 rounded-full bg-surface-200 overflow-hidden">
            <motion.div className="h-full bg-brand-500" initial={false} animate={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="text-sm font-bold text-brand-600 w-12 text-right">
          {currentStep + 1}/{QUESTIONS.length}
        </span>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto px-5 py-6 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }} className="w-full">
            <div className="text-center mb-8 mt-4">
              <span className="text-5xl mb-4 block drop-shadow-md">{currentQuestion?.emoji}</span>
              <h1 className="text-2xl font-extrabold text-surface-900 leading-snug">
                {currentQuestion?.text}
              </h1>
            </div>

            <div className="space-y-3">
              {currentQuestion?.options.map((opt) => {
                const isSelected = currentValue === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all text-left ${
                      isSelected
                        ? "border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10"
                        : "border-surface-200 bg-white hover:border-brand-300 shadow-sm"
                    }`}
                  >
                    <span className={`text-base font-semibold leading-snug pr-4 ${isSelected ? "text-brand-800" : "text-surface-700"}`}>
                      {opt.text}
                    </span>
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "border-brand-500 bg-brand-500" : "border-surface-300"
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {currentStep === QUESTIONS.length - 1 && currentValue && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mt-8 pb-8">
            <Button size="lg" className="w-full h-14 rounded-2xl text-lg shadow-xl shadow-brand-500/30" onClick={handleSubmit}>
              <Sparkles className="w-5 h-5 mr-2" />
              Generar Mi Plan de Entrenamiento
            </Button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
