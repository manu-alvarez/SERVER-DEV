'use client';

import React, { useState, useEffect } from 'react';
import { getEURRate, formatCurrency } from '@/lib/services/currency';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { DollarSign, Euro } from 'lucide-react';

interface CurrencyDisplayProps {
  amountUSD: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Displays price in the globally selected currency (USD or EUR).
 * Fetches live exchange rate on mount to accurately display EUR.
 */
export function CurrencyDisplay({
  amountUSD,
  className,
  size = 'md',
}: CurrencyDisplayProps) {
  const { currency } = useUIStore();
  const [eurAmount, setEurAmount] = useState<number | null>(null);
  const [rate, setRate] = useState<number>(0.85);

  useEffect(() => {
    getEURRate().then((r) => {
      setRate(r);
      setEurAmount(Math.round(amountUSD * r * 100) / 100);
    }).catch(() => {
      // Fallback to cached/estimated rate
      setEurAmount(Math.round(amountUSD * 0.85 * 100) / 100);
    });
  }, [amountUSD]);

  const sizeClasses = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  const displayAmount = currency === 'EUR' && eurAmount !== null ? eurAmount : amountUSD;
  const displayTitle = currency === 'EUR' ? `Original: $${amountUSD.toFixed(2)} (Rate: ${rate})` : '';

  return (
    <span className={cn('inline-flex items-center gap-1.5', sizeClasses, className)} title={displayTitle}>
      <span className="font-bold">{formatCurrency(displayAmount, currency)}</span>
    </span>
  );
}

/**
 * A toggle button to switch the global currency state.
 */
export function CurrencyToggle() {
  const { currency, setCurrency } = useUIStore();

  const handleToggle = () => {
    setCurrency(currency === 'USD' ? 'EUR' : 'USD');
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center w-8 h-8"
      title={`Cambiar a ${currency === 'USD' ? 'EUR' : 'USD'}`}
    >
      {currency === 'USD' ? <DollarSign size={16} /> : <Euro size={16} />}
    </button>
  );
}

/**
 * Live exchange rate badge shown in the header.
 */
export function ExchangeRateBadge() {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    getEURRate().then(setRate).catch(() => setRate(0.85));
  }, []);

  if (rate === null) return null;

  return (
    <span className="text-[10px] opacity-70 font-mono" title="Tipo de cambio en vivo">
      1 USD = {rate.toFixed(4)} EUR
    </span>
  );
}
