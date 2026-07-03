/** Price point for historical tracking */
export interface PricePoint {
  price: number;
  date: string;
  source: string;
}

/** Sentiment analysis from review extraction */
export interface SentimentScore {
  positive: number;
  negative: number;
  neutral: number;
  reliability: number;
  recurringDefects: string[];
  hiddenCosts: string[];
  summary: string;
}

/** Product source metadata */
export interface ProductSource {
  name: string;
  url: string;
  layer: 1 | 2 | 3;
  scrapedAt: string;
}

/** Core product entity */
export interface Product {
  id: string;
  title: string;
  description: string;
  price: {
    current: number;
    currency: string;
    historical: PricePoint[];
    lowestEver: number | null;
  };
  shipping: {
    cost: number | null;
    estimatedDays: number | null;
    hiddenFees: number;
  };
  source: ProductSource;
  ratings: {
    score: number | null;
    count: number;
    sentiment: SentimentScore | null;
  };
  opportunityScore: number;
  images: string[];
  category: string;
  tags: string[];
  stock: boolean | null;
  isElite?: boolean;
  isTravelPack?: boolean;
  travelInfo?: {
    origin?: string;
    destination?: string;
    transportType?: "plane" | "train" | "car" | "other";
    stayDuration?: string;
    departureDate?: string;
    returnDate?: string;
  };
}

/** Coupon code entity */
export interface CouponCode {
  code: string;
  discountPercent: number | null;
  discountAmount: number | null;
  sourceUrl: string;
  sourceName: string;
  verified: boolean;
  expiresAt: string | null;
}

/** Comparison matrix row */
export interface MatrixRow {
  metric: string;
  values: Record<string, string | number>;
  winnerId: string;
}

/** Full comparison result */
export interface ComparisonResult {
  products: Product[];
  matrix: MatrixRow[];
  aiVerdict: string;
  winner: {
    productId: string;
    reasons: string[];
  };
}

/** Search filters */
export interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  category?: string;
  freeShipping?: boolean;
}

/** Search query request */
export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  layers?: (1 | 2 | 3)[];
}

/** Layer search status */
export interface LayerStatus {
  layer: 1 | 2 | 3;
  status: "idle" | "searching" | "done" | "error";
  resultCount: number;
}

/** Search response */
export interface SearchResponse {
  products: Product[];
  layers: LayerStatus[];
  totalResults: number;
  query: string;
  searchTime: number;
  coupons: CouponCode[];
}
