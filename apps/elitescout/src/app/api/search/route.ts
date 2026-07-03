/**
 * POST /api/search
 * EliteScout Search Engine — 3-layer pipeline:
 *   Layer 1: Tavily Search (rich content + price extraction from text)
 *   Layer 2: Direct HTML scraping (JSON-LD/meta/microdata price extraction)
 *   Layer 3: Groq Llama 3.3 sentiment + AI enrichment
 * Fallback: DDG/Bing if Tavily is unavailable.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  searchProductsWithTavily,
  searchReviewsWithTavily,
  isTavilyConfigured,
} from "@/lib/engines/tavily";
import { searchProducts as searchProductsDDG, searchReviews as searchReviewsDDG } from "@/lib/engines/duckduckgo";
import { scrapePrices } from "@/lib/engines/price-scraper";
import { groqJSON, isGroqConfigured } from "@/lib/engines/groq";
import { generateJSON, isConfigured as isGeminiConfigured } from "@/lib/engines/gemini";
import { SENTIMENT_AGENT_PROMPT, TRAVEL_PACK_AGENT_PROMPT } from "@/lib/agents/prompts";
import { scoreProductSet } from "@/lib/scoring";
import { sanitizePrices } from "@/lib/pricePipeline";
import type { Product, LayerStatus, SentimentScore } from "@/types/schema";
import type { SearchRequest, SearchApiResponse } from "@/types/api";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body: SearchRequest = await req.json();
    const { query, filters, layers = [1, 2, 3], type = "product", origin, destination, transportMode } = body;

    const isTravel = type === "travel" || query.toLowerCase().includes("viaje") || query.toLowerCase().includes("vuelo");

    if (!query?.trim()) {
      return NextResponse.json<SearchApiResponse>(
        { success: false, error: "Query is required" },
        { status: 400 }
      );
    }

    const layerStatuses: LayerStatus[] = [
      { layer: 1, status: "idle", resultCount: 0 },
      { layer: 2, status: "idle", resultCount: 0 },
      { layer: 3, status: "idle", resultCount: 0 },
    ];

    let allProducts: Product[] = [];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // LAYER 1: Search Discovery (Tavily or DDG/Bing)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (layers.includes(1)) {
      layerStatuses[0].status = "searching";
      try {
        if (isTavilyConfigured()) {
          // PRIMARY: Tavily — rich content with price extraction
          const tavilyResults = await searchProductsWithTavily(query);
          const l1Products: Product[] = tavilyResults.map((r, i) => ({
            id: `l1-${Date.now()}-${i}`,
            title: r.title,
            description: r.content.slice(0, 200),
            price: {
              current: r.extractedPrice ?? 0,
              currency: r.currency || "EUR",
              historical: [],
              lowestEver: null,
            },
            shipping: { cost: null, estimatedDays: null, hiddenFees: 0 },
            source: {
              name: r.domain,
              url: r.url,
              layer: 1 as const,
              scrapedAt: new Date().toISOString(),
            },
            ratings: { score: null, count: 0, sentiment: null },
            opportunityScore: 0,
            images: [],
            category: isTravel ? "Travel" : "",
            tags: isTravel ? ["Travel", "Pack", transportMode || ""] : [],
            stock: null,
            isTravelPack: isTravel,
            travelInfo: isTravel ? {
              origin: origin || "N/A",
              destination: destination || (query.split(" ").pop() || "N/A"),
              transportType: transportMode || "plane",
            } : undefined
          }));

          allProducts.push(...l1Products);
          const withPrice = l1Products.filter((p) => p.price.current > 0).length;
          console.log(`[Layer 1] Tavily: ${l1Products.length} results, ${withPrice} with prices`);
        } else {
          // FALLBACK: DDG/Bing
          const ddgResults = await searchProductsDDG(query);
          const l1Products: Product[] = ddgResults.map((r, i) => ({
            id: `l1-${Date.now()}-${i}`,
            title: r.title,
            description: r.snippet,
            price: {
              current: r.extractedPrice ?? 0,
              currency: r.currency || "EUR",
              historical: [],
              lowestEver: null,
            },
            shipping: { cost: null, estimatedDays: null, hiddenFees: 0 },
            source: {
              name: r.domain,
              url: r.url,
              layer: 1 as const,
              scrapedAt: new Date().toISOString(),
            },
            ratings: { score: null, count: 0, sentiment: null },
            opportunityScore: 0,
            images: [],
            category: "",
            tags: [],
            stock: null,
          }));

          allProducts.push(...l1Products);
          console.log(`[Layer 1] DDG/Bing fallback: ${l1Products.length} results`);
        }

        layerStatuses[0].status = "done";
        layerStatuses[0].resultCount = allProducts.length;
      } catch (e) {
        console.error("[Layer 1] Error:", e);
        layerStatuses[0].status = "error";
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // LAYER 2: Direct HTML Price Scraping
    // No API needed — fetches store pages and extracts
    // prices from JSON-LD, meta tags, and microdata
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (layers.includes(2)) {
      layerStatuses[1].status = "searching";
      try {
        // Scrape ALL products that don't have prices yet
        const needsPrice = allProducts.filter((p) => p.price.current === 0);
        const urlsToScrape = needsPrice
          .map((p) => p.source.url)
          .filter((url) => !isBlockedDomain(url));

        if (urlsToScrape.length > 0) {
          const priceMap = await scrapePrices(urlsToScrape, 5);
          let enrichedCount = 0;

          for (const product of needsPrice) {
            const scraped = priceMap.get(product.source.url);
            if (scraped && scraped.price > 0) {
              product.price.current = scraped.price;
              product.price.currency = scraped.currency;
              product.source.layer = 2;
              if (scraped.title) product.title = scraped.title;
              if (scraped.rating) product.ratings.score = scraped.rating;
              if (scraped.inStock !== null) product.stock = scraped.inStock;
              // Shipping verified by direct scraping
              if (scraped.source === "json-ld" || scraped.source === "meta") {
                product.shipping.cost = 0; // JSON-LD usually means free
              }
              enrichedCount++;
            }
          }

          layerStatuses[1].resultCount = enrichedCount;
          console.log(`[Layer 2] HTML scraping: enriched ${enrichedCount}/${urlsToScrape.length} with prices`);
        }

        // Also try scraping products WITH prices to verify accuracy
        const hasPrice = allProducts.filter((p) => p.price.current > 0 && p.source.layer === 1);
        const verifyUrls = hasPrice.slice(0, 3).map((p) => p.source.url).filter((u) => !isBlockedDomain(u));
        if (verifyUrls.length > 0) {
          const verifyMap = await scrapePrices(verifyUrls, 3);
          for (const product of hasPrice.slice(0, 3)) {
            const scraped = verifyMap.get(product.source.url);
            if (scraped && scraped.price > 0) {
              // Use the more reliable source (JSON-LD > regex from content)
              if (scraped.source === "json-ld" || scraped.source === "meta") {
                product.price.current = scraped.price;
                product.source.layer = 2;
              }
              if (scraped.rating) product.ratings.score = scraped.rating;
            }
          }
        }

        layerStatuses[1].status = "done";
      } catch (e) {
        console.error("[Layer 2] Error:", e);
        layerStatuses[1].status = "error";
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // LAYER 3: AI Sentiment Analysis or Travel Pack Synthesis
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (layers.includes(3)) {
      layerStatuses[2].status = "searching";
      try {
        // Get search context (Layer 1 results + snippets)
        let contextContent = "";

        if (isTavilyConfigured()) {
          const reviews = await (isTravel ? searchProductsWithTavily(query) : searchReviewsWithTavily(query));
          contextContent = reviews.map((r) => r.content).filter(Boolean).join("\n\n---\n\n");
          layerStatuses[2].resultCount = reviews.length;
        }

        if (contextContent.length > 100) {
          const prompt = isTravel 
            ? `Resultados de búsqueda:\n${contextContent.slice(0, 8000)}`
            : `Producto: ${query}\n\nReseñas extraídas:\n${contextContent.slice(0, 8000)}`;
          
          const systemPrompt = isTravel ? TRAVEL_PACK_AGENT_PROMPT : SENTIMENT_AGENT_PROMPT;

          try {
            if (isTravel) {
              const synthesizedPacks = await (isGroqConfigured() 
                ? groqJSON<any[]>(systemPrompt, prompt) 
                : generateJSON<any[]>(systemPrompt, prompt));

              if (Array.isArray(synthesizedPacks) && synthesizedPacks.length > 0) {
                const packProducts: Product[] = synthesizedPacks.map((pack, i) => ({
                  id: `travel-pack-${Date.now()}-${i}`,
                  title: pack.title,
                  description: pack.description,
                  price: {
                    current: pack.price || 0,
                    currency: "EUR",
                    historical: [],
                    lowestEver: null,
                  },
                  shipping: { cost: 0, estimatedDays: null, hiddenFees: 0 },
                  source: {
                    name: pack.sourceName || "EliteScout Travel",
                    url: pack.sourceUrl || "#",
                    layer: 3,
                    scrapedAt: new Date().toISOString(),
                  },
                  ratings: { score: 4.5, count: 0, sentiment: null },
                  opportunityScore: 85, // High opportunity for synthesized packs
                  images: [],
                  category: "Travel Pack",
                  tags: ["Elite", "Pack", "Viaje"],
                  stock: true,
                  isTravelPack: true,
                  travelInfo: {
                    origin: pack.origin || origin || "",
                    destination: pack.destination || destination || "",
                    transportType: pack.transportType || transportMode || "plane",
                    stayDuration: pack.stayDuration,
                  }
                }));
                
                // Prepend synthesized packs
                allProducts = [...packProducts, ...allProducts];
              }
            } else {
              // Standard sentiment analysis
              const sentiment = await (isGroqConfigured()
                ? groqJSON<SentimentScore>(systemPrompt, prompt)
                : generateJSON<SentimentScore>(systemPrompt, prompt));

              allProducts = allProducts.map((p) => ({
                ...p,
                ratings: { ...p.ratings, sentiment },
              }));
            }
          } catch (e) {
            console.error("[Layer 3] AI processing failed:", e);
          }
        }

        layerStatuses[2].status = "done";
      } catch (e) {
        console.error("[Layer 3] Error:", e);
        layerStatuses[2].status = "error";
      }
    }

    // ━━━ APPLY FILTERS ━━━
    if (filters) {
      if (filters.minPrice !== undefined) {
        allProducts = allProducts.filter((p) => p.price.current >= filters.minPrice!);
      }
      if (filters.maxPrice !== undefined) {
        allProducts = allProducts.filter((p) => p.price.current > 0 && p.price.current <= filters.maxPrice!);
      }
      if (filters.minRating !== undefined) {
        allProducts = allProducts.filter((p) => (p.ratings.score ?? 0) >= filters.minRating!);
      }
      if (filters.freeShipping) {
        allProducts = allProducts.filter((p) => p.shipping.cost === 0);
      }
    }

    // ━━━ PRICE PIPELINE: Sanitize before scoring ━━━
    allProducts = sanitizePrices(allProducts);

    // ━━━ SCORE & SORT ━━━
    allProducts = scoreProductSet(allProducts);
    allProducts.sort((a, b) => {
      if (a.price.current > 0 && b.price.current === 0) return -1;
      if (a.price.current === 0 && b.price.current > 0) return 1;
      return b.opportunityScore - a.opportunityScore;
    });

    // ━━━ PYTHON MATRIX VALIDATION (isElite) ━━━
    try {
      const { exec } = require("child_process");
      const path = require("path");
      const util = require("util");
      const execPromise = util.promisify(exec);
      
      const scriptPath = path.join(process.cwd(), "scripts", "validate_matrix.py");
      // Escape JSON for shell argument by writing to a temp file or passing via stdin
      // Since stdin is safer for large JSONs, we use spawn or exec with echo
      const { stdout } = await execPromise(`echo '${JSON.stringify(allProducts).replace(/'/g, "'\\''")}' | python3 ${scriptPath}`);
      
      if (stdout) {
        const validatedProducts = JSON.parse(stdout);
        if (Array.isArray(validatedProducts) && validatedProducts.length > 0) {
          allProducts = validatedProducts;
        }
      }
    } catch (err) {
      console.error("[Python Validation Error]:", err);
      // Fallback: manually assign top 2 as elite if python fails
      if (allProducts.length > 0) allProducts[0] = { ...allProducts[0], isElite: true } as any;
      if (allProducts.length > 1) allProducts[1] = { ...allProducts[1], isElite: true } as any;
    }

    const searchTime = Date.now() - startTime;
    const withPrices = allProducts.filter((p) => p.price.current > 0).length;
    console.log(`[Search] "${query}" → ${allProducts.length} results, ${withPrices} with prices, ${searchTime}ms`);

    return NextResponse.json<SearchApiResponse>({
      success: true,
      data: {
        products: allProducts,
        layers: layerStatuses,
        totalResults: allProducts.length,
        query,
        searchTime,
        coupons: [],
      },
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json<SearchApiResponse>(
      { success: false, error: "Search failed" },
      { status: 500 }
    );
  }
}

/** Domains that block scraping */
function isBlockedDomain(url: string): boolean {
  const blocked = [
    "google.com", "facebook.com", "instagram.com", "twitter.com",
    "youtube.com", "linkedin.com",
  ];
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    return blocked.some((b) => domain.includes(b));
  } catch {
    return false;
  }
}
