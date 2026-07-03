/**
 * Currency Service — Conversor de divisas en tiempo real.
 *
 * Fuente: open.er-api.com (gratuito, sin API key, 1500 req/día)
 * Cache: 1 hora en memoria para evitar rate limiting.
 */

export type CurrencyCode = 'USD' | 'EUR' | 'GBP';

interface RateCache {
  rates: Record<string, number>;
  base: string;
  timestamp: number;
}

let cache: RateCache | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  USD: 'en-US',
  EUR: 'es-ES',
  GBP: 'en-GB',
};

/**
 * Fetch latest rates from open.er-api.com with caching.
 */
async function fetchRates(): Promise<RateCache> {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache;
  }

  const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) throw new Error(`Currency API returned ${res.status}`);

  const data = await res.json();
  cache = {
    rates: data.rates,
    base: data.base_code,
    timestamp: Date.now(),
  };
  return cache;
}

/**
 * Convert an amount from one currency to another.
 */
export async function convertCurrency(
  amount: number,
  from: CurrencyCode = 'USD',
  to: CurrencyCode = 'EUR'
): Promise<number> {
  if (from === to) return amount;
  const rates = await fetchRates();
  const rate = rates.rates[to] ?? 1;
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Format an amount in the given currency.
 */
export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format amount in both USD and EUR with a separator.
 */
export function formatDualCurrency(amountUSD: number, eurRate?: number): string {
  const usd = formatCurrency(amountUSD, 'USD');
  const eur = eurRate
    ? formatCurrency(Math.round(amountUSD * eurRate * 100) / 100, 'EUR')
    : '—';
  return `${usd} / ${eur}`;
}

/**
 * Get the current EUR/USD rate.
 */
export async function getEURRate(): Promise<number> {
  const rates = await fetchRates();
  return rates.rates['EUR'] ?? 0.85;
}

export { CURRENCY_SYMBOLS, CURRENCY_LOCALES };
