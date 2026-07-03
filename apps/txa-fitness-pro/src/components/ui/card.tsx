"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-white dark:bg-surface-900 shadow-sm",
      elevated: "bg-white dark:bg-surface-900 shadow-lg shadow-surface-200/50 dark:shadow-surface-900/50",
      bordered: "bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700",
    };

    return (
      <div
        ref={ref}
        className={cn("rounded-2xl p-6", variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
