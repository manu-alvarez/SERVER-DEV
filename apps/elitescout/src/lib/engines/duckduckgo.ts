/**
 * DuckDuckGo + Bing Fallback search engine.
 * Layer 1: Multi-engine web search with aggressive price extraction.
 * Falls back to Bing when DDG shows a CAPTCHA.
 */

interface DDGResult {
  title: string;
  url: string;
  snippet: string;
  extractedPrice: number | null;
  currency: string;
  domain: string;
}

// ━━━ PRIMARY: DuckDuckGo Lite ━━━

/**
 * Search via DuckDuckGo Lite (less aggressive bot detection).
 */
async function searchDDGLite(query: string, maxResults = 15): Promise<DDGResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://lite.duckduckgo.com/lite/?q=${encodedQuery}&kl=es-es`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
        Accept: "text/html",
        "Accept-Language": "es-ES,es;q=0.9",
      },
    });

    if (!response.ok) return [];

    const html = await response.text();

    // Check for CAPTCHA/anomaly
    if (html.includes("anomaly") || html.includes("challenge-form") || html.includes("bots use DuckDuckGo")) {
      console.warn("[DDG Lite] CAPTCHA detected, skipping");
      return [];
    }

    return parseDDGLiteResults(html, maxResults);
  } catch (error) {
    console.error("[DDG Lite] Error:", error);
    return [];
  }
}

/** Parse DDG Lite HTML — simpler table-based format */
function parseDDGLiteResults(html: string, maxResults: number): DDGResult[] {
  const results: DDGResult[] = [];

  // DDG Lite uses table rows with links
  // Pattern: <a rel="nofollow" href="URL" class='result-link'>Title</a>
  const linkPattern = /<a\s+rel="nofollow"\s+href="([^"]+)"\s+class='result-link'>([^<]+)<\/a>/g;
  // Snippet is in <td class="result-snippet">
  const snippetPattern = /<td\s+class="result-snippet">\s*([\s\S]*?)\s*<\/td>/g;

  const links = [...html.matchAll(linkPattern)];
  const snippets = [...html.matchAll(snippetPattern)];

  for (let i = 0; i < Math.min(links.length, maxResults); i++) {
    const link = links[i];
    const snippet = snippets[i];
    const rawUrl = link[1];
    const titleText = stripHtml(link[2]);
    const snippetText = snippet ? stripHtml(snippet[1]) : "";
    const combined = titleText + " " + snippetText;
    const priceData = extractPriceFromText(combined);

    results.push({
      title: titleText,
      url: rawUrl,
      snippet: snippetText,
      extractedPrice: priceData.price,
      currency: priceData.currency,
      domain: extractDomain(rawUrl),
    });
  }

  return results;
}

// ━━━ SECONDARY: DuckDuckGo HTML ━━━

async function searchDDGHtml(query: string, maxResults = 15): Promise<DDGResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}&kl=es-es`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.5",
      },
    });

    if (!response.ok) return [];
    const html = await response.text();

    if (html.includes("anomaly") || html.includes("challenge-form") || html.includes("bots use DuckDuckGo")) {
      console.warn("[DDG HTML] CAPTCHA detected, skipping");
      return [];
    }

    return parseDDGHtmlResults(html, maxResults);
  } catch (error) {
    console.error("[DDG HTML] Error:", error);
    return [];
  }
}

function parseDDGHtmlResults(html: string, maxResults: number): DDGResult[] {
  const results: DDGResult[] = [];
  const resultPattern = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>(.+?)<\/a>/g;
  const snippetPattern = /<a class="result__snippet"[^>]*>(.+?)<\/a>/g;

  const links = [...html.matchAll(resultPattern)];
  const snippets = [...html.matchAll(snippetPattern)];

  for (let i = 0; i < Math.min(links.length, maxResults); i++) {
    const link = links[i];
    const snippet = snippets[i];
    let rawUrl = link[1];
    const uddg = rawUrl.match(/uddg=([^&]+)/);
    if (uddg) rawUrl = decodeURIComponent(uddg[1]);

    const snippetText = snippet ? stripHtml(snippet[1]) : "";
    const titleText = stripHtml(link[2]);
    const combined = titleText + " " + snippetText;
    const priceData = extractPriceFromText(combined);

    results.push({
      title: titleText,
      url: rawUrl,
      snippet: snippetText,
      extractedPrice: priceData.price,
      currency: priceData.currency,
      domain: extractDomain(rawUrl),
    });
  }

  return results;
}

// ━━━ FALLBACK: Bing Search ━━━

async function searchBing(query: string, maxResults = 15): Promise<DDGResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.bing.com/search?q=${encodedQuery}&setlang=es&cc=es`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-ES,es;q=0.9",
      },
    });

    if (!response.ok) return [];
    const html = await response.text();
    return parseBingResults(html, maxResults);
  } catch (error) {
    console.error("[Bing] Error:", error);
    return [];
  }
}

function parseBingResults(html: string, maxResults: number): DDGResult[] {
  const results: DDGResult[] = [];

  // Bing result format: <li class="b_algo"><h2><a href="URL">Title</a></h2><p class="b_lineclamp...">Snippet</p></li>
  const blockPattern = /<li class="b_algo">([\s\S]*?)<\/li>/g;
  const blocks = [...html.matchAll(blockPattern)];

  for (let i = 0; i < Math.min(blocks.length, maxResults); i++) {
    const block = blocks[i][1];

    const linkMatch = block.match(/<a\s+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!linkMatch) continue;

    const url = linkMatch[1];
    const title = stripHtml(linkMatch[2]);

    // Extract snippet from <p> or <div class="b_caption">
    const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/) ||
                          block.match(/<div class="b_caption"[^>]*>([\s\S]*?)<\/div>/);
    const snippet = snippetMatch ? stripHtml(snippetMatch[1]) : "";

    const combined = title + " " + snippet;
    const priceData = extractPriceFromText(combined);

    results.push({
      title,
      url,
      snippet,
      extractedPrice: priceData.price,
      currency: priceData.currency,
      domain: extractDomain(url),
    });
  }

  return results;
}

// ━━━ PUBLIC API ━━━

/**
 * Product-focused search with multi-engine fallback.
 * Tries: DDG Lite → DDG HTML → Bing
 */
export async function searchProducts(query: string): Promise<DDGResult[]> {
  const queries = [
    `${query} precio comprar oferta`,
    `${query} price buy €`,
  ];

  // Try DDG Lite first (least bot detection)
  let allResults = await Promise.all(queries.map((q) => searchDDGLite(q, 12)));
  let merged = deduplicateResults(allResults.flat());

  if (merged.length > 0) {
    console.log(`[Layer 1] DDG Lite: ${merged.length} results`);
    return merged.slice(0, 20);
  }

  // Fallback: DDG HTML
  allResults = await Promise.all(queries.map((q) => searchDDGHtml(q, 12)));
  merged = deduplicateResults(allResults.flat());

  if (merged.length > 0) {
    console.log(`[Layer 1] DDG HTML: ${merged.length} results`);
    return merged.slice(0, 20);
  }

  // Fallback: Bing
  console.warn("[Layer 1] DDG unavailable, falling back to Bing");
  allResults = await Promise.all(queries.map((q) => searchBing(q, 12)));
  merged = deduplicateResults(allResults.flat());
  console.log(`[Layer 1] Bing: ${merged.length} results`);

  return merged.slice(0, 20);
}

/** Search for coupon codes. */
export async function searchCoupons(productName: string, storeName: string): Promise<DDGResult[]> {
  const q = `${storeName} ${productName} código descuento cupón coupon ${new Date().getFullYear()}`;
  const results = await searchDDGLite(q, 10);
  if (results.length > 0) return results;
  return searchBing(q, 10);
}

/** Search for reviews and forum sentiment. */
export async function searchReviews(query: string): Promise<DDGResult[]> {
  const q = `${query} review opiniones reseñas site:reddit.com OR site:trustpilot.com OR site:chollometro.com`;
  const results = await searchDDGLite(q, 10);
  if (results.length > 0) return results;
  return searchBing(q, 10);
}

// ━━━ UTILITIES ━━━

/** Deduplicate results by domain+title, prefer priced items, sort price-first */
function deduplicateResults(results: DDGResult[]): DDGResult[] {
  const seen = new Map<string, DDGResult>();
  for (const r of results) {
    const key = r.domain + "|" + r.title.slice(0, 40).toLowerCase();
    const existing = seen.get(key);
    if (!existing || (r.extractedPrice && !existing.extractedPrice)) {
      seen.set(key, r);
    }
  }
  const merged = [...seen.values()];
  merged.sort((a, b) => {
    if (a.extractedPrice && !b.extractedPrice) return -1;
    if (!a.extractedPrice && b.extractedPrice) return 1;
    if (a.extractedPrice && b.extractedPrice) return a.extractedPrice - b.extractedPrice;
    return 0;
  });
  return merged;
}

/**
 * Price extraction from text with confidence weighting.
 * Handles €, $, £ in all common European/US formats.
 */
function extractPriceFromText(text: string): { price: number | null; currency: string } {
  if (!text) return { price: null, currency: "EUR" };

  const prices: { value: number; currency: string; confidence: number }[] = [];

  const patterns: { regex: RegExp; currency: string; confidence: number }[] = [
    { regex: /€\s?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2}))/g, currency: "EUR", confidence: 10 },
    { regex: /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2}))\s?€/g, currency: "EUR", confidence: 10 },
    { regex: /€\s?(\d{1,6})/g, currency: "EUR", confidence: 8 },
    { regex: /(\d{1,6})\s?€/g, currency: "EUR", confidence: 8 },
    { regex: /\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2}))/g, currency: "USD", confidence: 10 },
    { regex: /\$\s?(\d{1,6}(?:\.\d{1,2})?)/g, currency: "USD", confidence: 8 },
    { regex: /£\s?(\d{1,6}(?:[.,]\d{1,2})?)/g, currency: "GBP", confidence: 8 },
    { regex: /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2}))\s*(?:EUR|euros?)/gi, currency: "EUR", confidence: 9 },
    { regex: /(\d{1,6}(?:\.\d{1,2})?)\s*(?:USD|dollars?)/gi, currency: "USD", confidence: 9 },
    { regex: /(?:precio|price|desde|from|por|only|solo|ahora|now)\s*:?\s*(\d{1,6}(?:[.,]\d{1,2})?)\s*[€$£]?/gi, currency: "EUR", confidence: 7 },
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
  const reasonable = topConfidence.filter((p) => p.value >= 5 && p.value <= 10000);
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

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&euro;/g, "€")
    .replace(/&pound;/g, "£")
    .replace(/&dollar;/g, "$")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "unknown";
  }
}
