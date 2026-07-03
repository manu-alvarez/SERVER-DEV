/**
 * Price Pipeline — Outlier detection, sanity checks, and AI-assisted extraction.
 * Ensures only verified, real product prices reach the UI.
 */

import { groqJSON, isGroqConfigured } from "./engines/groq";
import type { Product } from "@/types/schema";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OUTLIER DETECTION — Statistical price validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Remove price outliers using Median Absolute Deviation (MAD).
 * Products with prices < 10% or > 300% of the median are flagged.
 */
export function filterPriceOutliers(products: Product[]): Product[] {
  const priced = products.filter((p) => p.price.current > 0);
  if (priced.length < 3) return products; // Not enough data for statistics

  // Calculate median
  const prices = priced.map((p) => p.price.current).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];

  if (median <= 0) return products;

  // Define acceptable range: 10% — 300% of median
  const lowerBound = median * 0.10;
  const upperBound = median * 3.0;

  return products.map((p) => {
    if (p.price.current <= 0) return p; // No price, keep as-is

    const isOutlier = p.price.current < lowerBound || p.price.current > upperBound;

    if (isOutlier) {
      console.warn(
        `[PricePipeline] Outlier: ${p.price.current}€ for "${p.title?.slice(0, 40)}" (median: ${median}€, range: ${lowerBound.toFixed(0)}-${upperBound.toFixed(0)}€)`
      );
      return {
        ...p,
        price: { ...p.price, current: 0 },
        tags: [...(p.tags || []), "price-outlier"],
        opportunityScore: Math.max(0, (p.opportunityScore || 0) - 40),
      };
    }

    return p;
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CARRIER / PLAN PRICE DETECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Keywords that indicate a price is a monthly plan, not a product price. */
const PLAN_INDICATORS = [
  "/mes", "/month", "monthly", "mensual", "al mes",
  "plan", "prepaid", "prepago", "contrato",
  "financing", "financiacion", "lease", "trade-in",
  "with activation", "con activacion",
  "installment", "cuota", "pago mensual",
];

/**
 * Detect if a product's price is likely from a carrier plan, not real retail.
 */
export function isCarrierPrice(product: Product): boolean {
  const text = `${product.title} ${product.description}`.toLowerCase();
  return PLAN_INDICATORS.some((kw) => text.includes(kw));
}

/**
 * Remove products with carrier/plan pricing.
 */
export function filterCarrierPrices(products: Product[]): Product[] {
  return products.filter((p) => {
    if (isCarrierPrice(p)) {
      console.warn(`[PricePipeline] Carrier price filtered: "${p.title?.slice(0, 50)}"`);
      return false;
    }
    return true;
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAYER 3.5: AI PRICE EXTRACTOR (Groq fallback)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AI_PRICE_EXTRACTOR_PROMPT = `Eres un extractor de precios de alta precision. Se te da el contenido de una pagina web.

Tu tarea:
1. Encuentra el PRECIO DE VENTA FINAL del producto (no cuotas mensuales, no precios con plan movil, no trade-in).
2. Determina la moneda (EUR, USD, GBP).
3. Si hay multiples precios, elige el precio de compra directa mas bajo.

Responde SOLO con JSON:
{
  "price": 0.0,
  "currency": "EUR",
  "confidence": "high | medium | low",
  "reason": "breve explicacion"
}

Si no puedes determinar un precio real, devuelve: {"price": null, "currency": "EUR", "confidence": "none", "reason": "no price found"}`;

interface AIPriceResult {
  price: number | null;
  currency: string;
  confidence: "high" | "medium" | "low" | "none";
  reason: string;
}

/**
 * Use Groq LLM to extract price from raw page content when regex fails.
 */
export async function extractPriceWithAI(
  rawContent: string,
  productTitle: string
): Promise<AIPriceResult> {
  if (!isGroqConfigured()) {
    return { price: null, currency: "EUR", confidence: "none", reason: "No LLM configured" };
  }

  try {
    const truncated = rawContent.slice(0, 4000); // Keep within token limits
    const prompt = `Producto buscado: "${productTitle}"\n\nContenido de la pagina:\n${truncated}`;

    const result = await groqJSON<AIPriceResult>(AI_PRICE_EXTRACTOR_PROMPT, prompt);

    if (result.price && result.price > 0 && result.confidence !== "none") {
      console.log(`[Layer 3.5] AI extracted price: ${result.price} ${result.currency} (${result.confidence}) — ${result.reason}`);
    }

    return result;
  } catch (error) {
    console.error("[Layer 3.5] AI price extraction failed:", error);
    return { price: null, currency: "EUR", confidence: "none", reason: "extraction failed" };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CURRENCY CONVERSION (basic USD → EUR)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Approximate exchange rates — updated periodically. */
const EXCHANGE_RATES: Record<string, number> = {
  USD: 0.92,
  GBP: 1.17,
  EUR: 1.0,
};

/**
 * Convert a price to EUR using approximate exchange rates.
 */
export function convertToEUR(price: number, currency: string): number {
  const rate = EXCHANGE_RATES[currency.toUpperCase()];
  if (!rate) return price;
  return Math.round(price * rate * 100) / 100;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FULL PIPELINE: Run all sanitization steps
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Run the complete price sanitization pipeline on a set of products.
 * Order: Carrier filter → Currency normalization → Outlier detection
 */
export function sanitizePrices(products: Product[]): Product[] {
  console.log(`[PricePipeline] Input: ${products.length} products`);

  // Step 1: Remove carrier/plan pricing
  let cleaned = filterCarrierPrices(products);
  console.log(`[PricePipeline] After carrier filter: ${cleaned.length}`);

  // Step 2: Normalize currencies to EUR
  cleaned = cleaned.map((p) => {
    if (p.price.currency && p.price.currency !== "EUR" && p.price.current > 0) {
      const eurPrice = convertToEUR(p.price.current, p.price.currency);
      console.log(`[PricePipeline] ${p.price.current} ${p.price.currency} → ${eurPrice} EUR`);
      return {
        ...p,
        price: { ...p.price, current: eurPrice, currency: "EUR" },
      };
    }
    return p;
  });

  // Step 3: Remove statistical outliers
  cleaned = filterPriceOutliers(cleaned);

  const validPrices = cleaned.filter((p) => p.price.current > 0).length;
  console.log(`[PricePipeline] Output: ${cleaned.length} products (${validPrices} with valid prices)`);

  return cleaned;
}
