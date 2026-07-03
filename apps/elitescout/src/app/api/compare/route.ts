/**
 * POST /api/compare
 * Builds comparison matrix and generates AI verdict via Gemini.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateJSON, isConfigured } from "@/lib/engines/gemini";
import { groqJSON, isGroqConfigured } from "@/lib/engines/groq";
import { COMPARISON_VERDICT_PROMPT } from "@/lib/agents/prompts";
import type { MatrixRow } from "@/types/schema";
import type { CompareRequest, CompareApiResponse } from "@/types/api";

export async function POST(req: NextRequest) {
  try {
    const body: CompareRequest = await req.json();
    const { products } = body;

    if (!products || products.length < 2) {
      return NextResponse.json<CompareApiResponse>(
        { success: false, error: "At least 2 products required" },
        { status: 400 }
      );
    }

    // ━━━ BUILD COMPARISON MATRIX ━━━
    const matrix: MatrixRow[] = [];

    // Price row
    const priceValues: Record<string, number> = {};
    products.forEach((p) => { priceValues[p.id] = p.price.current; });
    const lowestPriceId = Object.entries(priceValues).sort(([, a], [, b]) => a - b)[0]?.[0] ?? products[0].id;
    matrix.push({
      metric: "Precio Actual",
      values: Object.fromEntries(products.map((p) => [p.id, `${p.price.current} ${p.price.currency}`])),
      winnerId: lowestPriceId,
    });

    // Shipping row
    const shippingValues: Record<string, number> = {};
    products.forEach((p) => { shippingValues[p.id] = (p.shipping.cost ?? 0) + p.shipping.hiddenFees; });
    const lowestShipId = Object.entries(shippingValues).sort(([, a], [, b]) => a - b)[0]?.[0] ?? products[0].id;
    matrix.push({
      metric: "Coste de Envío + Tasas",
      values: Object.fromEntries(products.map((p) => [p.id, p.shipping.cost !== null ? `${((p.shipping.cost) + p.shipping.hiddenFees).toFixed(2)} ${p.price.currency}` : "N/D"])),
      winnerId: lowestShipId,
    });

    // Total cost row
    const totalValues: Record<string, number> = {};
    products.forEach((p) => { totalValues[p.id] = p.price.current + (p.shipping.cost ?? 0) + p.shipping.hiddenFees; });
    const lowestTotalId = Object.entries(totalValues).sort(([, a], [, b]) => a - b)[0]?.[0] ?? products[0].id;
    matrix.push({
      metric: "Coste Total Real",
      values: Object.fromEntries(products.map((p) => [p.id, `${(p.price.current + (p.shipping.cost ?? 0) + p.shipping.hiddenFees).toFixed(2)} ${p.price.currency}`])),
      winnerId: lowestTotalId,
    });

    // Rating row
    const ratingValues: Record<string, number> = {};
    products.forEach((p) => { ratingValues[p.id] = p.ratings.score ?? 0; });
    const bestRatingId = Object.entries(ratingValues).sort(([, a], [, b]) => b - a)[0]?.[0] ?? products[0].id;
    matrix.push({
      metric: "Rating / Valoración",
      values: Object.fromEntries(products.map((p) => [p.id, p.ratings.score ? `${p.ratings.score}/5 (${p.ratings.count})` : "N/A"])),
      winnerId: bestRatingId,
    });

    // Sentiment row
    matrix.push({
      metric: "Sentimiento Real",
      values: Object.fromEntries(products.map((p) => [p.id, p.ratings.sentiment ? `${p.ratings.sentiment.positive}% positivo` : "N/A"])),
      winnerId: products.reduce((best, p) => ((p.ratings.sentiment?.positive ?? 0) > (best.ratings.sentiment?.positive ?? 0) ? p : best), products[0]).id,
    });

    // Opportunity Score row
    const bestScoreId = products.reduce((best, p) => (p.opportunityScore > best.opportunityScore ? p : best), products[0]).id;
    matrix.push({
      metric: "Puntuación Oportunidad",
      values: Object.fromEntries(products.map((p) => [p.id, `${p.opportunityScore}/100`])),
      winnerId: bestScoreId,
    });

    // ━━━ AI VERDICT (Groq > Gemini) ━━━
    let aiVerdict = "";
    let winnerId = bestScoreId;
    let reasons: string[] = [];

    const hasLLM = isGroqConfigured() || isConfigured();

    if (hasLLM) {
      try {
        const productSummaries = products.map((p) => JSON.stringify({
          id: p.id,
          title: p.title,
          price: p.price,
          shipping: p.shipping,
          ratings: p.ratings,
          opportunityScore: p.opportunityScore,
          source: p.source.name,
        }, null, 2)).join("\n\n");

        type VerdictResult = { verdict: string; winnerId: string; reasons: string[] };
        let verdict: VerdictResult;

        if (isGroqConfigured()) {
          verdict = await groqJSON<VerdictResult>(COMPARISON_VERDICT_PROMPT, productSummaries);
        } else {
          verdict = await generateJSON<VerdictResult>(COMPARISON_VERDICT_PROMPT, productSummaries);
        }

        aiVerdict = verdict.verdict;
        winnerId = verdict.winnerId;
        reasons = verdict.reasons;
      } catch (e) {
        console.error("AI verdict generation failed:", e);
        aiVerdict = "Análisis AI no disponible en este momento.";
      }
    } else {
      aiVerdict = "Configure GROQ_API_KEY o GEMINI_API_KEY para análisis con IA.";
    }

    return NextResponse.json<CompareApiResponse>({
      success: true,
      data: {
        products,
        matrix,
        aiVerdict,
        winner: { productId: winnerId, reasons },
      },
    });
  } catch (error) {
    console.error("Compare API error:", error);
    return NextResponse.json<CompareApiResponse>(
      { success: false, error: "Comparison failed" },
      { status: 500 }
    );
  }
}
