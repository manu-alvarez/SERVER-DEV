import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==========================================
// BUTTON
// ==========================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:pointer-events-none active:scale-95 cursor-pointer',
          {
            // Variants
            'bg-brand-600 text-white hover:bg-brand-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.6)] border border-brand-500/50': variant === 'primary',
            'bg-card text-foreground hover:bg-muted border border-border': variant === 'secondary',
            'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20': variant === 'danger',
            'hover:bg-muted text-muted-foreground hover:text-foreground': variant === 'ghost',
            'border-2 border-brand-500/30 text-brand-400 hover:bg-brand-500/10 hover:border-brand-500': variant === 'outline',
            'btn-premium': variant === 'premium',
            
            // Sizes
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-12 px-8 text-lg': size === 'lg',
            'h-10 w-10 p-2': size === 'icon',
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ==========================================
// INPUT
// ==========================================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground shadow-inner backdrop-blur-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground',
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';

// ==========================================
// SELECT
// ==========================================
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, icon, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        <select
          ref={ref}
          className={cn(
            'flex h-11 w-full appearance-none rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground shadow-inner backdrop-blur-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pl-10',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
          </svg>
        </div>
      </div>
    );
  }
);
Select.displayName = 'Select';

// ==========================================
// CARD (Glassmorphism)
// ==========================================
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { portal?: boolean }>(
  ({ className, portal, children, ...props }, ref) => {
    if (portal) {
      return (
        <div ref={ref} className={cn('portal-card', className)} {...props}>
          <div className="portal-card-inner p-6">
            {children}
          </div>
        </div>
      );
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'glass-panel rounded-xl overflow-hidden p-6',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// ==========================================
// BADGE
// ==========================================
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          {
            'bg-muted text-muted-foreground': variant === 'default',
            'bg-accent-500/20 text-accent-400 border border-accent-500/30': variant === 'success',
            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30': variant === 'warning',
            'bg-red-500/20 text-red-400 border border-red-500/30': variant === 'danger',
            'border border-border text-foreground': variant === 'outline',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

// ==========================================
// MODAL
// ==========================================
export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg glass-panel rounded-xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10 transition-colors">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
