"use client";

import { motion } from "framer-motion";

interface OpportunityBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

/**
 * Opportunity Score badge with color-coded glow (0-100).
 * Gold glow for high scores, cyan for medium, muted for low.
 */
export function OpportunityBadge({ score, size = "md" }: OpportunityBadgeProps) {
  const { color, bg, glow, label } = getScoreStyle(score);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 min-w-[36px]",
    md: "text-sm px-3 py-1 min-w-[44px]",
    lg: "text-base px-4 py-1.5 min-w-[52px]",
  };

  return (
    <motion.div
      className={`inline-flex items-center justify-center font-semibold rounded-full ${sizeClasses[size]}`}
      style={{
        color,
        background: bg,
        boxShadow: glow,
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      title={`Opportunity Score: ${score}/100 — ${label}`}
    >
      {score}
    </motion.div>
  );
}

function getScoreStyle(score: number) {
  if (score >= 80)
    return {
      color: "#D4AF37",
      bg: "rgba(212, 175, 55, 0.12)",
      glow: "0 0 12px rgba(212, 175, 55, 0.25)",
      label: "Excelente oportunidad",
    };
  if (score >= 60)
    return {
      color: "#00E5FF",
      bg: "rgba(0, 229, 255, 0.1)",
      glow: "0 0 12px rgba(0, 229, 255, 0.2)",
      label: "Buena oportunidad",
    };
  if (score >= 40)
    return {
      color: "#A0A0A0",
      bg: "rgba(160, 160, 160, 0.1)",
      glow: "none",
      label: "Oportunidad media",
    };
  return {
    color: "#666666",
    bg: "rgba(102, 102, 102, 0.08)",
    glow: "none",
    label: "Baja oportunidad",
  };
}
