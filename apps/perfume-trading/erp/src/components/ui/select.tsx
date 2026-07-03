'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function Select({ label, options, error, className, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-[#605E5C] dark:text-[#aaa] mb-1">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full border px-3 py-1.5 text-sm bg-white dark:bg-[#2b2b2b] text-[#323130] dark:text-[#e0e0e0]',
          'border-[#EDEBE9] dark:border-[#444] focus:outline-none focus:border-[#f43f5e] dark:focus:border-[#fb7185]',
          error && 'border-red-500',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
