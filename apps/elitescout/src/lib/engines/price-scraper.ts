/**
 * Direct HTML Price Scraper — No API dependencies.
 * Extracts prices from store pages using:
 *   1. JSON-LD (Schema.org Product)
 *   2. OpenGraph meta tags (og:price:amount)
 *   3. Microdata (itemprop="price")
 *   4. Regex patterns on raw HTML
 */

export interface ScrapedPrice {
  price: number;
  currency: string;
  title: string | null;
  rating: number | null;
  inStock: boolean | null;
  source: "json-ld" | "meta" | "microdata" | "regex";
}

/**
 * Fetch a store URL and extract structured price data from HTML.
 * No API keys needed — pure HTML parsing.
 */
export async function scrapePrice(url: string): Promise<ScrapedPrice | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.5",
        "Accept-Encoding": "identity",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();
    if (html.length < 500) return null;

    // Try extraction methods in order of reliability
    return (
      extractFromJsonLd(html) ??
      extractFromMetaTags(html) ??
      extractFromMicrodata(html) ??
      extractFromRegex(html)
    );
  } catch {
    return null;
  }
}

/**
 * Batch scrape multiple URLs for prices.
 */
export async function scrapePrices(
  urls: string[],
  batchSize = 4
): Promise<Map<string, ScrapedPrice>> {
  const results = new Map<string, ScrapedPrice>();

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const settled = await Promise.allSettled(
      batch.map(async (url) => {
        const price = await scrapePrice(url);
        if (price) results.set(url, price);
      })
    );

    // Small delay between batches
    if (i + batchSize < urls.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return results;
}

// ━━━ EXTRACTION METHODS ━━━

/** Extract from JSON-LD (Schema.org Product) — most reliable */
function extractFromJsonLd(html: string): ScrapedPrice | null {
  const ldBlocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (!ldBlocks) return null;

  for (const block of ldBlocks) {
    const jsonContent = block.replace(/<script[^>]*>/, "").replace(/<\/script>/, "").trim();
    try {
      const data = JSON.parse(jsonContent);
      const product = findProduct(data);
      if (product) return product;
    } catch {
      // Try to salvage partial JSON
      try {
        const priceMatch = jsonContent.match(/"price"\s*:\s*["']?(\d+[.,]?\d*)["']?/);
        const currencyMatch = jsonContent.match(/"priceCurrency"\s*:\s*["'](\w+)["']/);
        if (priceMatch) {
          return {
            price: normalizePrice(priceMatch[1]),
            currency: currencyMatch?.[1] || "EUR",
            title: null,
            rating: null,
            inStock: null,
            source: "json-ld",
          };
        }
      } catch { /* skip */ }
    }
  }

  return null;
}

/** Recursively find Product type in JSON-LD */
function findProduct(data: unknown): ScrapedPrice | null {
  if (!data || typeof data !== "object") return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const result = findProduct(item);
      if (result) return result;
    }
    return null;
  }

  const obj = data as Record<string, unknown>;
  const type = obj["@type"];

  if (
    type === "Product" ||
    type === "IndividualProduct" ||
    (Array.isArray(type) && type.includes("Product"))
  ) {
    const offers = obj.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
    let price: number | null = null;
    let currency = "EUR";

    if (offers) {
      const offer = Array.isArray(offers) ? offers[0] : offers;
      if (offer) {
        const p = offer.price ?? offer.lowPrice ?? offer.highPrice;
        if (p !== undefined) {
          price = typeof p === "string" ? normalizePrice(p) : Number(p);
          currency = (offer.priceCurrency as string) || "EUR";
        }
      }
    }

    // Direct price on product
    if (!price && obj.price !== undefined) {
      price = typeof obj.price === "string" ? normalizePrice(obj.price as string) : Number(obj.price);
    }

    if (price && price > 0 && price < 50000) {
      const rating = extractRatingFromLd(obj);
      const availability = offers && !Array.isArray(offers) ? (offers.availability as string) : null;
      const inStock = availability ? availability.toLowerCase().includes("instock") : null;

      return {
        price,
        currency,
        title: (obj.name as string) || null,
        rating,
        inStock,
        source: "json-ld",
      };
    }
  }

  // Check nested @graph
  if (obj["@graph"] && Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      const result = findProduct(item);
      if (result) return result;
    }
  }

  return null;
}

function extractRatingFromLd(obj: Record<string, unknown>): number | null {
  const agg = obj.aggregateRating as Record<string, unknown> | undefined;
  if (agg?.ratingValue) {
    const val = Number(agg.ratingValue);
    return isNaN(val) ? null : val;
  }
  return null;
}

/** Extract from OpenGraph meta tags */
function extractFromMetaTags(html: string): ScrapedPrice | null {
  const pricePatterns = [
    /property=["'](?:og:price:amount|product:price:amount)["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+property=["'](?:og:price:amount|product:price:amount)["']/i,
    /name=["'](?:price|twitter:data1)["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+name=["']price["']/i,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      const price = normalizePrice(match[1]);
      if (price > 0 && price < 50000) {
        // Try to get currency
        const currencyMatch = html.match(
          /property=["'](?:og:price:currency|product:price:currency)["']\s+content=["'](\w+)["']/i
        ) || html.match(
          /content=["'](\w+)["']\s+property=["'](?:og:price:currency|product:price:currency)["']/i
        );

        const titleMatch = html.match(
          /property=["']og:title["']\s+content=["']([^"']+)["']/i
        );

        return {
          price,
          currency: currencyMatch?.[1] || "EUR",
          title: titleMatch?.[1] || null,
          rating: null,
          inStock: null,
          source: "meta",
        };
      }
    }
  }

  return null;
}

/** Extract from microdata (itemprop="price") */
function extractFromMicrodata(html: string): ScrapedPrice | null {
  const patterns = [
    /itemprop=["']price["'][^>]*content=["']([^"']+)["']/i,
    /content=["']([^"']+)["'][^>]*itemprop=["']price["']/i,
    /itemprop=["']price["'][^>]*>[\s]*([€$£]?\d+[.,]?\d*)/i,
    /data-price=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const price = normalizePrice(match[1]);
      if (price > 0 && price < 50000) {
        const currencyMatch = html.match(/itemprop=["']priceCurrency["'][^>]*content=["'](\w+)["']/i);
        return {
          price,
          currency: currencyMatch?.[1] || "EUR",
          title: null,
          rating: null,
          inStock: null,
          source: "microdata",
        };
      }
    }
  }

  return null;
}

/** Fallback: regex price extraction from HTML body */
function extractFromRegex(html: string): ScrapedPrice | null {
  // Focus on price-likely areas: near "price", "precio", "€"
  // Extract all price candidates
  const candidates: { value: number; currency: string; context: number }[] = [];

  const patterns: { regex: RegExp; currency: string; context: number }[] = [
    // Class/id with "price" + amount
    { regex: /class=["'][^"']*price[^"']*["'][^>]*>[\s]*([€$£]?\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2}))/gi, currency: "EUR", context: 10 },
    // €XX.XX or XX.XX€
    { regex: /€\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2}))/g, currency: "EUR", context: 5 },
    { regex: /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2}))\s*€/g, currency: "EUR", context: 5 },
    // Price context words
    { regex: /(?:precio|price|pvp|p\.v\.p)\s*:?\s*[€$£]?\s*(\d{1,6}(?:[.,]\d{1,2}))/gi, currency: "EUR", context: 8 },
  ];

  for (const p of patterns) {
    for (const match of html.matchAll(p.regex)) {
      const raw = match[1].replace(/[€$£\s]/g, "");
      const value = normalizePrice(raw);
      if (value > 1 && value < 50000) {
        candidates.push({ value, currency: p.currency, context: p.context });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Sort by context score, pick best
  candidates.sort((a, b) => b.context - a.context);
  const best = candidates[0];

  return {
    price: best.value,
    currency: best.currency,
    title: null,
    rating: null,
    inStock: null,
    source: "regex",
  };
}

// ━━━ UTILS ━━━

function normalizePrice(raw: string): number {
  let s = raw.trim().replace(/[€$£\s]/g, "");
  // European: 1.299,00 → 1299.00
  if (/\d{1,3}\.\d{3}/.test(s) && s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  // European: 49,95 → 49.95
  else if (/^\d+,\d{1,2}$/.test(s)) {
    s = s.replace(",", ".");
  }
  // US: 1,299.00 → 1299.00
  else if (/\d{1,3},\d{3}/.test(s)) {
    s = s.replace(/,/g, "");
  }
  return parseFloat(s) || 0;
}
