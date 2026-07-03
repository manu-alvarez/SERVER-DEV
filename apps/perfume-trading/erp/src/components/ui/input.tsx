'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-[#605E5C] dark:text-[#aaa] mb-1">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full border px-3 py-1.5 text-sm bg-white dark:bg-[#2b2b2b] text-[#323130] dark:text-[#e0e0e0]',
          'border-[#EDEBE9] dark:border-[#444] focus:outline-none focus:border-[#f43f5e] dark:focus:border-[#fb7185]',
          'placeholder:text-[#aaa] dark:placeholder:text-[#666]',
          error && 'border-red-500 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#605E5C] dark:text-[#888]" size={14} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-1.5 text-sm border border-[#EDEBE9] dark:border-[#444] bg-white dark:bg-[#2b2b2b] text-[#323130] dark:text-[#e0e0e0] focus:outline-none focus:border-[#f43f5e] dark:focus:border-[#fb7185] placeholder:text-[#aaa] dark:placeholder:text-[#666]"
      />
    </div>
  );
}
