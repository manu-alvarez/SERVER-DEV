/**
 * Tavily Search API — Premium search with content extraction.
 * Returns actual page content, not just snippets, making price extraction reliable.
 * Free tier: 1000 searches/month.
 * @see https://docs.tavily.com
 */

const TAVILY_API_URL = "https://api.tavily.com/search";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string;
}

interface TavilyResponse {
  query: string;
  results: TavilyResult[];
  answer?: string;
  response_time: number;
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  domain: string;
  score: number;
  extractedPrice: number | null;
  currency: string;
}

/**
 * Check if Tavily API key is configured.
 */
export function isTavilyConfigured(): boolean {
  return !!process.env.TAVILY_API_KEY;
}

/**
 * Search using Tavily API — returns rich content suitable for price extraction.
 */
async function tavilySearch(
  query: string,
  options: {
    searchDepth?: "basic" | "advanced";
    maxResults?: number;
    includeDomains?: string[];
    excludeDomains?: string[];
  } = {}
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const { searchDepth = "basic", maxResults = 10, includeDomains, excludeDomains } = options;

  try {
    const body: Record<string, unknown> = {
      query,
      search_depth: searchDepth,
      max_results: maxResults,
      include_answer: false,
    };

    if (includeDomains?.length) {
      body.include_domains = includeDomains;
    }

    if (excludeDomains?.length) {
      body.exclude_domains = excludeDomains;
    }

    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`[Tavily] API error: ${response.status}`);
      return [];
    }

    const data: TavilyResponse = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("[Tavily] Error:", error);
    return [];
  }
}

/**
 * Product-focused search with price extraction from Tavily content.
 * Uses two queries: shopping-focused and comparison-focused.
 */
export async function searchProductsWithTavily(query: string): Promise<TavilySearchResult[]> {
  // ━━━ CARRIER & NON-RETAIL BLACKLIST ━━━
  const excludeDomains = [
    // Social media
    "instagram.com", "facebook.com", "twitter.com", "x.com",
    "tiktok.com", "youtube.com", "reddit.com", "pinterest.com",
    "linkedin.com", "wikipedia.org",
    // Mobile carriers (show plan prices, not product prices)
    "optimum.com", "espanol.optimum.com", "metrobyt-mobile.com",
    "cricketwireless.com", "espanol.cricketwireless.com",
    "boostmobile.com", "t-mobile.com", "es.t-mobile.com",
    "verizon.com", "att.com", "visible.com", "mintmobile.com",
    "sprint.com", "uscellular.com", "xfinity.com", "spectrum.com",
    "consumer.cellular.com", "straighttalk.com", "tracfone.com",
    "totalwireless.com", "simplemobile.com", "cricketwireless.com",
    // Financing/lease pages
    "affirm.com", "klarna.com", "afterpay.com",
    // Forums & blogs (no prices)
    "quora.com", "medium.com", "blogspot.com",
  ];

  // ━━━ TRUSTED RETAIL DOMAINS ━━━
  const trustedRetail = [
    "amazon.es", "pccomponentes.com", "mediamarkt.es",
    "fnac.es", "elcorteingles.es", "idealo.es",
    "carrefour.es", "alcampo.es", "worten.es",
    "douglas.es", "sephora.es", "primor.eu",
    "ebay.es", "aliexpress.com",
    "druni.es", "notino.es", "perfumesclub.com",
    "backmarket.es", "asgoodasnew.es",
    "coolmod.com", "ldlc.com", "alternate.es",
    "phonehouse.es", "simyo.es",
  ];

  // Run two complementary searches in parallel
  const [shoppingResults, comparisonResults] = await Promise.all([
    tavilySearch(`${query} precio comprar oferta`, {
      searchDepth: "basic",
      maxResults: 10,
      excludeDomains,
    }),
    tavilySearch(`${query} comparar precio tienda online españa`, {
      searchDepth: "advanced",
      maxResults: 8,
      includeDomains: trustedRetail,
    }),
  ]);

  const allResults = [...shoppingResults, ...comparisonResults];

  // Deduplicate by URL
  const seen = new Map<string, TavilySearchResult>();
  for (const r of allResults) {
    if (seen.has(r.url)) continue;

    // Skip social media that slipped through
    const domain = extractDomain(r.url);
    if (excludeDomains.some((d) => domain.includes(d))) continue;

    const priceData = extractPriceFromContent(r.content, r.title);

    seen.set(r.url, {
      title: r.title,
      url: r.url,
      content: r.content,
      domain,
      score: r.score,
      extractedPrice: priceData.price,
      currency: priceData.currency,
    });
  }

  const results = [...seen.values()];

  // Sort: priced items first, then by search score
  results.sort((a, b) => {
    if (a.extractedPrice && !b.extractedPrice) return -1;
    if (!a.extractedPrice && b.extractedPrice) return 1;
    return b.score - a.score;
  });

  return results;
}

/**
 * Search for reviews.
 */
export async function searchReviewsWithTavily(query: string): Promise<TavilySearchResult[]> {
  const results = await tavilySearch(`${query} opiniones review reseñas`, {
    searchDepth: "basic",
    maxResults: 5,
    includeDomains: [
      "reddit.com", "trustpilot.com", "chollometro.com",
      "forocoches.com", "xataka.com", "computerhoy.com",
    ],
  });

  return results.map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    domain: extractDomain(r.url),
    score: r.score,
    extractedPrice: null,
    currency: "EUR",
  }));
}

/**
 * Extract price from Tavily content text.
 * Content is much richer than Bing/DDG snippets, so price extraction is more reliable.
 */
function extractPriceFromContent(
  content: string,
  title: string
): { price: number | null; currency: string } {
  if (!content && !title) return { price: null, currency: "EUR" };

  const text = (title || "") + " " + (content || "");
  const prices: { value: number; currency: string; confidence: number }[] = [];

  const patterns: { regex: RegExp; currency: string; confidence: number }[] = [
    // High confidence: explicit € amounts
    { regex: /€\s?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2}))/g, currency: "EUR", confidence: 10 },
    { regex: /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2}))\s?€/g, currency: "EUR", confidence: 10 },
    { regex: /€\s?(\d{1,6})/g, currency: "EUR", confidence: 8 },
    { regex: /(\d{1,6})\s?€/g, currency: "EUR", confidence: 8 },
    // $ amounts
    { regex: /\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2}))/g, currency: "USD", confidence: 10 },
    { regex: /\$\s?(\d{1,6}(?:\.\d{1,2})?)/g, currency: "USD", confidence: 8 },
    // £ amounts
    { regex: /£\s?(\d{1,6}(?:[.,]\d{1,2})?)/g, currency: "GBP", confidence: 8 },
    // Textual: "199,99 EUR" or "199.99 euros"
    { regex: /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2}))\s*(?:EUR|euros?)/gi, currency: "EUR", confidence: 9 },
    // Contextual: "precio: 199,99", "desde 49,95€"
    { regex: /(?:precio|price|desde|from|por|pvp|p\.v\.p)\s*:?\s*(\d{1,6}(?:[.,]\d{1,2})?)\s*[€$£]?/gi, currency: "EUR", confidence: 7 },
  ];

  for (const p of patterns) {
    for (const match of text.matchAll(p.regex)) {
      const raw = match[1];
      if (!raw) continue;
      const num = normalizePrice(raw);
      if (num > 0.5 && num < 50000) {
        prices.push({ value: num, currency: p.currency, confidence: p.confidence });
      }
    }
  }

  if (prices.length === 0) return { price: null, currency: "EUR" };

  prices.sort((a, b) => b.confidence - a.confidence);
  const topConfidence = prices.filter((p) => p.confidence >= prices[0].confidence - 1);
  const reasonable = topConfidence.filter((p) => p.value >= 3 && p.value <= 10000);
  const best = reasonable.length > 0 ? reasonable[0] : topConfidence[0];

  return { price: best.value, currency: best.currency };
}

function normalizePrice(raw: string): number {
  let s = raw.trim();
  if (/\d{1,3}\.\d{3}/.test(s) && s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d+,\d{1,2}$/.test(s)) {
    s = s.replace(",", ".");
  } else if (/\d{1,3},\d{3}/.test(s)) {
    s = s.replace(/,/g, "");
  }
  return parseFloat(s) || 0;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "unknown";
  }
}
