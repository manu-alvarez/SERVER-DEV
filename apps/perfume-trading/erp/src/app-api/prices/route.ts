import { NextResponse } from 'next/server';
import { PriceIntelligence } from '@/lib/services/price-intelligence';

/**
 * GET /api/prices?ean=3145891073607
 * GET /api/prices?eans=3145891073607,3508441001114
 *
 * Price Intelligence endpoint.
 * Returns real market prices from Fraganty → Fragella → Local fallback.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const singleEan = searchParams.get('ean');
    const bulkEans = searchParams.get('eans');

    const configured = PriceIntelligence.getConfiguredSources();

    if (singleEan) {
      const result = await PriceIntelligence.getMarketPrice(singleEan);
      return NextResponse.json({
        ean: singleEan,
        ...result,
        sources_configured: configured,
      });
    }

    if (bulkEans) {
      const eans = bulkEans.split(',').map((s) => s.trim());
      const prices = await PriceIntelligence.getBulkPrices(eans);
      return NextResponse.json({
        results: prices,
        count: Object.keys(prices).length,
        sources_configured: configured,
      });
    }

    // Return all local data
    const localData = PriceIntelligence.getLocalPriceData();
    return NextResponse.json({
      local_data: localData,
      count: Object.keys(localData).length,
      sources_configured: configured,
      note: 'Add ?ean=<code> or get free API key at api@fraganty.ai',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Price fetch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
