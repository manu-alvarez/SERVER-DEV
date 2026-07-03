import { NextResponse } from 'next/server';
import { getEURRate, formatCurrency, convertCurrency } from '@/lib/services/currency';
import type { CurrencyCode } from '@/lib/services/currency';

/**
 * GET /api/currency?amount=100&from=USD&to=EUR
 * GET /api/currency (returns current rate)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = parseFloat(searchParams.get('amount') ?? '0');
    const from = (searchParams.get('from') ?? 'USD') as CurrencyCode;
    const to = (searchParams.get('to') ?? 'EUR') as CurrencyCode;

    const rate = await getEURRate();

    if (amount > 0) {
      const converted = await convertCurrency(amount, from, to);
      return NextResponse.json({
        amount,
        from,
        to,
        converted,
        rate,
        formatted_from: formatCurrency(amount, from),
        formatted_to: formatCurrency(converted, to),
        timestamp: new Date().toISOString(),
        source: 'open.er-api.com (gratuito)',
      });
    }

    return NextResponse.json({
      base: 'USD',
      rates: { EUR: rate, USD: 1, GBP: rate * 1.19 },
      source: 'open.er-api.com (gratuito)',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Currency fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
