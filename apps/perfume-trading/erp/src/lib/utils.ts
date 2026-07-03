import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with conflict resolution.
 * Combines clsx (conditional classes) + tailwind-merge (conflict resolution).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency (USD).
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string to locale format.
 */
export function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get status color scheme for badges.
 */
export function getStatusColor(status: string): {
  bg: string;
  text: string;
  dot: string;
} {
  const statusLower = status.toLowerCase();
  if (['active', 'activa', 'accepted', 'completado', 'paid'].includes(statusLower)) {
    return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' };
  }
  if (['pending', 'pendiente', 'draft', 'expired'].includes(statusLower)) {
    return { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' };
  }
  if (['rejected', 'cancelled', 'cancelada', 'inactive'].includes(statusLower)) {
    return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' };
  }
  return { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' };
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
