'use client';

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}: ModalProps) {
  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEsc]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative bg-white dark:bg-[#1e1e1e] shadow-xl border border-[#EDEBE9] dark:border-[#333] w-full mx-4',
          sizeClasses[size]
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDEBE9] dark:border-[#333]">
          <h3 className="text-sm font-bold text-[#323130] dark:text-[#e0e0e0]">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#F3F2F1] dark:hover:bg-[#333] rounded transition-colors">
            <X size={16} className="text-[#605E5C] dark:text-[#888]" />
          </button>
        </div>
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-[#EDEBE9] dark:border-[#333] flex justify-end space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
