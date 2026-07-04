import React, { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------- Button ----------------
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      default: 'bg-gradient-to-r from-msb-primary to-msb-secondary text-white shadow-lg hover:shadow-msb-primary/50 hover:-translate-y-0.5',
      outline: 'border border-msb-primary/50 text-msb-primary hover:bg-msb-primary/10',
      ghost: 'text-slate-300 hover:bg-white/5 hover:text-white',
      danger: 'bg-msb-error text-white hover:bg-msb-error/90 shadow-lg shadow-msb-error/20',
    };
    
    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-8 text-lg font-medium',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-msb-primary disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ---------------- Input ----------------
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-msb-primary/50 focus:border-msb-primary transition-all',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// ---------------- Card ----------------
export const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { portal?: boolean }>(
  ({ className, portal, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-slate-800 bg-msb-card text-slate-100 shadow-sm overflow-hidden',
        portal && 'glass-panel border-msb-primary/20',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

// ---------------- Badge ----------------
export const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' | 'outline', className?: string }) => {
  const variants = {
    default: 'bg-msb-primary/20 text-msb-primary border-msb-primary/30',
    success: 'bg-msb-success/20 text-msb-success border-msb-success/30',
    warning: 'bg-msb-accent/20 text-msb-accent border-msb-accent/30',
    error: 'bg-msb-error/20 text-msb-error border-msb-error/30',
    outline: 'border-slate-700 text-slate-300',
  };
  
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors', variants[variant], className)}>
      {children}
    </span>
  );
};

// ---------------- Modal ----------------
export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      <div className="glass-panel w-full max-w-md rounded-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-lg font-semibold neon-text-primary">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// ---------------- Select ----------------
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white',
          'focus:outline-none focus:ring-2 focus:ring-msb-primary/50 focus:border-msb-primary transition-all',
          'disabled:cursor-not-allowed disabled:opacity-50 appearance-none',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';
