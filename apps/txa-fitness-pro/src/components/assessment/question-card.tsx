"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";
import {
  Moon,
  Clock,
  Brain,
  Apple,
  Droplet,
  Dumbbell,
  Flame,
  Heart,
  Zap,
  Target,
  Wine,
  Activity,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  moon: Moon,
  clock: Clock,
  brain: Brain,
  apple: Apple,
  droplet: Droplet,
  dumbbell: Dumbbell,
  flame: Flame,
  heart: Heart,
  zap: Zap,
  target: Target,
  wine: Wine,
  activity: Activity,
};

interface QuestionData {
  id: string;
  question: string;
  options: { id: string; label: string; value: number }[];
  icon: string;
}

interface QuestionCardProps {
  question: QuestionData;
  selectedValue: number | null;
  onSelect: (optionId: string, value: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionCard({
  question,
  selectedValue,
  onSelect,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const IconComponent = ICON_MAP[question.icon] ?? Activity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="mb-6">
        <span className="text-sm font-medium text-brand-600">
          Pregunta {questionNumber} de {totalQuestions}
        </span>
      </div>

      <Card variant="elevated" className="mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
            {IconComponent && <IconComponent className="w-6 h-6 text-brand-600 dark:text-brand-400" />}
          </div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white leading-tight">
            {question.question}
          </h2>
        </div>

        <div className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id, option.value)}
              className={cn(
                "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
                "hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10",
                "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
                selectedValue === option.value
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-sm"
                  : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
              )}
            >
              <span
                className={cn(
                  "text-base font-medium",
                  selectedValue === option.value
                    ? "text-brand-800 dark:text-brand-300"
                    : "text-surface-700 dark:text-surface-300"
                )}
              >
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
