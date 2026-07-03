"use client";

import { Slot } from "@radix-ui/react-slot";
import { motion } from "motion/react";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-primary text-primary-foreground hover:brightness-110 active:brightness-90",
  destructive: "bg-danger text-white hover:brightness-110 active:brightness-90",
  outline: "border border-border bg-transparent hover:bg-muted active:bg-muted/80",
  secondary: "bg-secondary text-secondary-foreground hover:brightness-110 active:brightness-90",
  ghost: "hover:bg-muted active:bg-muted/80",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizes = {
  default: "h-10 px-5 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-xl px-8",
  icon: "h-10 w-10",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="inline-block"
      >
        <Comp
          type="button"
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50",
            variants[variant],
            sizes[size],
            "cursor-pointer",
            className,
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  },
);
Button.displayName = "Button";

export { Button };
