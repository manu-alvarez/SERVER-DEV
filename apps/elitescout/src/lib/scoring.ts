/**
 * Opportunity Score Algorithm.
 * Proprietary scoring system that evaluates the real value of a product offer.
 * Score range: 0-100
 *
 * Weights:
 *   - priceCompetitiveness: 0.25 (percentile vs category)
 *   - qualityPriceRatio:    0.25 (sentiment-adjusted value)
 *   - sentimentReliability: 0.20 (review trust score)
 *   - shippingEfficiency:   0.15 (cost + speed)
 *   - urgencyFactor:        0.15 (stock scarcity, price trend)
 */

import type { Product } from "@/types/schema";

const WEIGHTS = {
  priceCompetitiveness: 0.25,
  qualityPriceRatio: 0.25,
  sentimentReliability: 0.2,
  shippingEfficiency: 0.15,
  urgencyFactor: 0.15,
} as const;

/**
 * Calculate the Opportunity Score for a product against its competitive set.
 */
export function calculateOpportunityScore(
  product: Product,
  competitorPrices: number[]
): number {
  const pc = priceCompetitiveness(product.price.current, competitorPrices);
  const qp = qualityPriceRatio(product);
  const sr = sentimentReliability(product);
  const se = shippingEfficiency(product);
  const uf = urgencyFactor(product);

  const raw =
    WEIGHTS.priceCompetitiveness * pc +
    WEIGHTS.qualityPriceRatio * qp +
    WEIGHTS.sentimentReliability * sr +
    WEIGHTS.shippingEfficiency * se +
    WEIGHTS.urgencyFactor * uf;

  return Math.round(Math.max(0, Math.min(100, raw)));
}

/**
 * Batch-calculate scores for a set of products.
 * Each product is scored relative to the others in the set.
 */
export function scoreProductSet(products: Product[]): Product[] {
  if (products.length === 0) return [];

  const prices = products.map((p) => p.price.current).filter((p) => p > 0);

  return products.map((product) => ({
    ...product,
    opportunityScore: calculateOpportunityScore(product, prices),
  }));
}

/** Price percentile rank: lower price = higher score */
function priceCompetitiveness(price: number, allPrices: number[]): number {
  if (allPrices.length === 0 || price <= 0) return 50;

  const sorted = [...allPrices].sort((a, b) => a - b);
  const rank = sorted.findIndex((p) => p >= price);
  const percentile = (rank / sorted.length) * 100;

  // Lower price = higher score (inverted percentile)
  return 100 - percentile;
}

/** Quality/price ratio based on reviews and sentiment */
function qualityPriceRatio(product: Product): number {
  const rating = product.ratings.score ?? 3;
  const sentiment = product.ratings.sentiment;

  let qualitySignal = (rating / 5) * 60;

  if (sentiment) {
    qualitySignal += sentiment.positive * 0.3;
    qualitySignal -= sentiment.negative * 0.2;
  }

  // Check historical pricing — bonus if near all-time low
  if (product.price.lowestEver && product.price.lowestEver > 0) {
    const ratio = product.price.current / product.price.lowestEver;
    if (ratio <= 1.1) qualitySignal += 15; // Within 10% of lowest
    else if (ratio <= 1.3) qualitySignal += 8;
  }

  return Math.max(0, Math.min(100, qualitySignal));
}

/** Trust score from sentiment analysis */
function sentimentReliability(product: Product): number {
  const sentiment = product.ratings.sentiment;
  if (!sentiment) return 50; // Neutral if no data

  const base = sentiment.reliability * 100;
  const defectPenalty = sentiment.recurringDefects.length * 5;
  const hiddenCostPenalty = sentiment.hiddenCosts.length * 8;

  return Math.max(0, Math.min(100, base - defectPenalty - hiddenCostPenalty));
}

/** Shipping cost and speed evaluation */
function shippingEfficiency(product: Product): number {
  let score = 60; // Neutral when no data

  if (product.shipping.cost === null) {
    return score; // Unknown shipping — neutral
  }

  // Free shipping bonus
  if (product.shipping.cost === 0) {
    score = 100;
  } else if (product.price.current > 0) {
    // Penalize high shipping relative to product price
    const shippingRatio = product.shipping.cost / product.price.current;
    if (shippingRatio > 0.2) score -= 30;
    else if (shippingRatio > 0.1) score -= 15;
    else if (shippingRatio > 0.05) score -= 5;
  }

  // Hidden fees penalty
  score -= product.shipping.hiddenFees * 10;

  // Fast delivery bonus
  if (product.shipping.estimatedDays !== null) {
    if (product.shipping.estimatedDays <= 2) score += 10;
    else if (product.shipping.estimatedDays > 7) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/** Stock scarcity and price trend */
function urgencyFactor(product: Product): number {
  let score = 50; // Neutral baseline

  // Low stock urgency
  if (product.stock === false) return 0;
  if (product.stock === true) score += 10;

  // Price trend from historical data
  const history = product.price.historical;
  if (history.length >= 2) {
    const recent = history[history.length - 1].price;
    const previous = history[history.length - 2].price;
    const trend = (previous - recent) / previous;

    if (trend > 0.1) score += 25; // Price dropping significantly
    else if (trend > 0.05) score += 15;
    else if (trend < -0.05) score -= 15; // Price rising
  }

  return Math.max(0, Math.min(100, score));
}
