'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ElementType;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-[#f43f5e] text-white hover:bg-[#e11d48] active:bg-[#003d6b] border border-transparent',
  secondary:
    'bg-white text-[#323130] hover:bg-[#F3F2F1] border border-[#8A8886] dark:bg-[#2b2b2b] dark:text-[#e0e0e0] dark:border-[#555]',
  ghost:
    'bg-transparent text-[#605E5C] hover:bg-[#F3F2F1] dark:hover:bg-[#333] border border-transparent',
  danger:
    'bg-red-600 text-white hover:bg-red-700 border border-transparent',
  outline:
    'bg-transparent text-[#f43f5e] border border-[#f43f5e] hover:bg-[#F0F7FF] dark:hover:bg-[#1a2a3a]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-1.5 text-sm',
  lg: 'px-6 py-2 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#f43f5e]/40 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon size={16} className={cn('shrink-0', children ? 'mr-2' : '')} />
      ) : null}
      {children}
    </button>
  );
}
