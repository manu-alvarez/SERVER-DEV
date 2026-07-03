/**
 * Jina AI Reader — Free web scraping to clean Markdown.
 * Layer 2: Converts any URL to structured Markdown for LLM processing.
 * Completely free, no API key needed for basic usage.
 * @see https://jina.ai/reader
 */

const JINA_BASE_URL = "https://r.jina.ai";

interface JinaReadResult {
  content: string;
  title: string;
  url: string;
  success: boolean;
}

/**
 * Reads a URL and converts it to clean Markdown via Jina AI Reader.
 * Free tier: no API key needed, rate limits apply (~20 RPM).
 */
export async function readUrl(targetUrl: string): Promise<JinaReadResult> {
  try {
    const response = await fetch(`${JINA_BASE_URL}/${targetUrl}`, {
      headers: {
        Accept: "text/plain",
        "X-Return-Format": "markdown",
      },
    });

    if (!response.ok) {
      console.error(`Jina Reader failed for ${targetUrl}: ${response.status}`);
      return { content: "", title: "", url: targetUrl, success: false };
    }

    const content = await response.text();
    const title = extractTitle(content);

    return { content, title, url: targetUrl, success: true };
  } catch (error) {
    console.error("Jina Reader error:", error);
    return { content: "", title: "", url: targetUrl, success: false };
  }
}

/**
 * Reads multiple URLs concurrently with rate limiting.
 * Processes in batches of 3 to respect free tier limits.
 */
export async function readMultipleUrls(
  urls: string[],
  batchSize = 3
): Promise<JinaReadResult[]> {
  const results: JinaReadResult[] = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(readUrl));
    results.push(...batchResults);

    // Rate limit pause between batches
    if (i + batchSize < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Searches for product data within Jina-extracted Markdown.
 * Extracts structured product information using pattern matching.
 */
export async function extractProductData(url: string): Promise<{
  rawMarkdown: string;
  prices: string[];
  hasSchemaOrg: boolean;
}> {
  const result = await readUrl(url);

  if (!result.success) {
    return { rawMarkdown: "", prices: [], hasSchemaOrg: false };
  }

  // Extract price patterns from markdown
  const pricePatterns = [
    /\$\d+[.,]?\d*/g,
    /€\d+[.,]?\d*/g,
    /£\d+[.,]?\d*/g,
    /\d+[.,]?\d*\s*(?:USD|EUR|GBP)/gi,
    /(?:price|precio|prix)[\s:]*[\$€£]?\d+[.,]?\d*/gi,
  ];

  const prices: string[] = [];
  for (const pattern of pricePatterns) {
    const matches = result.content.match(pattern);
    if (matches) prices.push(...matches);
  }

  const hasSchemaOrg =
    result.content.includes("schema.org") ||
    result.content.includes("Schema.org") ||
    result.content.includes("itemtype") ||
    result.content.includes("application/ld+json");

  return {
    rawMarkdown: result.content,
    prices: [...new Set(prices)],
    hasSchemaOrg,
  };
}

/** Extract title from Markdown content */
function extractTitle(markdown: string): string {
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  if (titleMatch) return titleMatch[1].trim();
  const firstLine = markdown.split("\n").find((l) => l.trim().length > 0);
  return firstLine?.slice(0, 100) || "Untitled";
}
