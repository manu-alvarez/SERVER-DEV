'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex space-x-1 bg-[#F3F2F1] dark:bg-[#2a2a2a] p-1 border border-[#EDEBE9] dark:border-[#333]', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'flex items-center px-4 py-1.5 text-sm font-medium transition-colors',
            active === tab.key
              ? 'bg-white dark:bg-[#3a3a3a] text-[#f43f5e] dark:text-[#fb7185] shadow-sm'
              : 'text-[#605E5C] dark:text-[#888] hover:text-[#323130] dark:hover:text-[#ccc]'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-2 text-[10px] bg-[#EDEBE9] dark:bg-[#444] px-1.5 py-0.5 rounded-full">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
