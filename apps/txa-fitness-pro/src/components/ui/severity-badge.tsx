"use client";

import { cn } from "@/utils/cn";
import { SEVERITY_LABELS, SEVERITY_COLORS } from "@/utils/constants";

interface SeverityBadgeProps {
  severity: number;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const color = SEVERITY_COLORS[severity] ?? "bg-surface-400";
  const label = SEVERITY_LABELS[severity] ?? "Desconocido";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white",
        color,
        className
      )}
    >
      {label}
    </span>
  );
}
