"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";

interface AIVerdictProps {
  verdict: string;
  reasons: string[];
  isLoading?: boolean;
}

/**
 * AI-generated comparison verdict display with streaming-ready layout.
 */
export function AIVerdict({ verdict, reasons, isLoading }: AIVerdictProps) {
  if (isLoading) {
    return (
      <GlassCard variant="cyan" className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" />
          <span className="text-sm text-cyan font-medium">
            Analizando con IA...
          </span>
        </div>
        <div className="space-y-2">
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-5/6 rounded" />
          <div className="skeleton h-3 w-4/6 rounded" />
        </div>
      </GlassCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <GlassCard variant="cyan" className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-cyan text-lg">🤖</span>
          <h3 className="text-sm font-semibold text-cyan">
            Veredicto del Análisis IA
          </h3>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
          {verdict}
        </p>

        {reasons.length > 0 && (
          <div className="pt-3 border-t border-cyan/10">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Razones clave
            </h4>
            <ul className="space-y-1.5">
              {reasons.map((reason, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-2 text-xs text-text-secondary"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <span className="text-cyan mt-0.5 shrink-0">▸</span>
                  {reason}
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
