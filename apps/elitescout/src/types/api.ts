import type { SearchFilters, SearchResponse, ComparisonResult, CouponCode } from "./schema";

/** POST /api/search */
export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  layers?: (1 | 2 | 3)[];
  type?: "product" | "travel";
  origin?: string;
  destination?: string;
  transportMode?: "plane" | "train" | "car";
}

export interface SearchApiResponse {
  success: boolean;
  data?: SearchResponse;
  error?: string;
}

/** POST /api/compare */
export interface CompareRequest {
  productIds: string[];
  products: import("./schema").Product[];
}

export interface CompareApiResponse {
  success: boolean;
  data?: ComparisonResult;
  error?: string;
}

/** POST /api/coupons */
export interface CouponRequest {
  productName: string;
  storeName: string;
}

export interface CouponApiResponse {
  success: boolean;
  data?: CouponCode[];
  error?: string;
}

/** POST /api/analyze */
export interface AnalyzeRequest {
  productA: import("./schema").Product;
  productB: import("./schema").Product;
}

export interface AnalyzeApiResponse {
  success: boolean;
  data?: {
    verdict: string;
    winnerId: string;
    reasons: string[];
  };
  error?: string;
}
