"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "gold" | "cyan";
  hover?: boolean;
  onClick?: () => void;
}

/**
 * Reusable glassmorphic card container with premium hover effects.
 */
export function GlassCard({
  children,
  className = "",
  variant = "default",
  hover = true,
  onClick,
}: GlassCardProps) {
  const variantClasses = {
    default: "glass",
    gold: "glass-gold",
    cyan: "glass-cyan",
  };

  return (
    <motion.div
      className={`${variantClasses[variant]} rounded-[16px] p-5 ${className}`}
      whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {children}
    </motion.div>
  );
}
