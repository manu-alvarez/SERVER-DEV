/**
 * POST /api/coupons
 * Coupon Hunter Agent — searches for valid promo codes.
 * Uses DuckDuckGo + Jina Reader + Gemini extraction.
 */

import { NextRequest, NextResponse } from "next/server";
import { searchCoupons } from "@/lib/engines/duckduckgo";
import { readMultipleUrls } from "@/lib/engines/jina";
import { generateJSON, isConfigured } from "@/lib/engines/gemini";
import { COUPON_HUNTER_PROMPT } from "@/lib/agents/prompts";
import type { CouponCode } from "@/types/schema";
import type { CouponRequest, CouponApiResponse } from "@/types/api";

export async function POST(req: NextRequest) {
  try {
    const body: CouponRequest = await req.json();
    const { productName, storeName } = body;

    if (!productName || !storeName) {
      return NextResponse.json<CouponApiResponse>(
        { success: false, error: "productName and storeName are required" },
        { status: 400 }
      );
    }

    // Step 1: Search for coupon pages via DDG
    const searchResults = await searchCoupons(productName, storeName);

    if (searchResults.length === 0) {
      return NextResponse.json<CouponApiResponse>({
        success: true,
        data: [],
      });
    }

    // Step 2: Scrape top 3 results via Jina
    const topUrls = searchResults.slice(0, 3).map((r) => r.url);
    const scrapedPages = await readMultipleUrls(topUrls);

    const successfulScrapes = scrapedPages.filter((s) => s.success && s.content.length > 50);

    if (successfulScrapes.length === 0) {
      return NextResponse.json<CouponApiResponse>({
        success: true,
        data: [],
      });
    }

    // Step 3: Extract coupons with Gemini (if configured)
    let coupons: CouponCode[] = [];

    if (isConfigured()) {
      const combinedContent = successfulScrapes
        .map((s) => `--- Fuente: ${s.url} ---\n${s.content.slice(0, 3000)}`)
        .join("\n\n");

      try {
        coupons = await generateJSON<CouponCode[]>(
          COUPON_HUNTER_PROMPT,
          `Producto: ${productName}\nTienda: ${storeName}\n\nContenido extraído:\n${combinedContent}`
        );

        // Ensure array and validate structure
        if (!Array.isArray(coupons)) coupons = [];
        coupons = coupons.filter(
          (c) => c.code && typeof c.code === "string" && c.code.length >= 4
        );
      } catch {
        console.error("Coupon extraction via Gemini failed");
        coupons = [];
      }
    } else {
      // Fallback: basic regex extraction
      coupons = extractCouponsManually(successfulScrapes);
    }

    return NextResponse.json<CouponApiResponse>({
      success: true,
      data: coupons,
    });
  } catch (error) {
    console.error("Coupons API error:", error);
    return NextResponse.json<CouponApiResponse>(
      { success: false, error: "Coupon search failed" },
      { status: 500 }
    );
  }
}

/** Fallback manual extraction using regex patterns */
function extractCouponsManually(
  pages: { content: string; url: string }[]
): CouponCode[] {
  const coupons: CouponCode[] = [];
  // Match alphanumeric codes that look like promo codes (4-20 chars, uppercase + digits)
  const codePattern = /\b([A-Z0-9]{4,20})\b/g;
  // Context words that suggest nearby text is a coupon
  const contextWords = /(?:code|código|cupón|coupon|promo|descuento|discount|off|save)/i;

  for (const page of pages) {
    const lines = page.content.split("\n");
    for (const line of lines) {
      if (!contextWords.test(line)) continue;
      const matches = line.match(codePattern);
      if (matches) {
        for (const code of matches.slice(0, 3)) {
          // Skip common false positives
          if (["HTTP", "HTML", "JSON", "TRUE", "FALSE", "NULL", "HTTPS"].includes(code)) continue;
          coupons.push({
            code,
            discountPercent: null,
            discountAmount: null,
            sourceUrl: page.url,
            sourceName: extractDomain(page.url),
            verified: false,
            expiresAt: null,
          });
        }
      }
    }
  }

  // Deduplicate by code
  const seen = new Set<string>();
  return coupons.filter((c) => {
    if (seen.has(c.code)) return false;
    seen.add(c.code);
    return true;
  });
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return "unknown"; }
}
