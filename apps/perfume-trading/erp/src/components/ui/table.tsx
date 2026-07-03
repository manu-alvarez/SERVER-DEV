'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  rowKey: (item: T) => string | number;
}

export function Table<T>({
  columns,
  data,
  onRowClick,
  loading,
  emptyMessage = 'No hay datos',
  rowKey,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1e1e1e] border border-[#EDEBE9] dark:border-[#333]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#F3F2F1] dark:bg-[#2a2a2a] text-[#605E5C] dark:text-[#888]">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-2 font-semibold text-xs uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, r) => (
              <tr key={r} className="animate-pulse">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-[#F3F2F1] dark:bg-[#333] rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1e1e1e] border border-[#EDEBE9] dark:border-[#333]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#F3F2F1] dark:bg-[#2a2a2a] text-[#605E5C] dark:text-[#888]">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-2 font-semibold text-xs uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="py-12 text-center text-sm text-[#605E5C] dark:text-[#888]">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1e1e1e] border border-[#EDEBE9] dark:border-[#333] shadow-sm overflow-hidden">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-[#F3F2F1] dark:bg-[#2a2a2a] text-[#605E5C] dark:text-[#888]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-2 font-semibold text-xs uppercase tracking-wider',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EDEBE9] dark:divide-[#333]">
          {data.map((item) => (
            <tr
              key={rowKey(item)}
              className={cn(
                'hover:bg-[#F3F2F1] dark:hover:bg-[#2a2a2a] transition-colors',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-[#323130] dark:text-[#e0e0e0]',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.className
                  )}
                >
                  {col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
