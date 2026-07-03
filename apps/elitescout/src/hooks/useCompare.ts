"use client";

import { useMutation } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import type { Product, ComparisonResult } from "@/types/schema";
import { apiUrl } from "@/lib/api";

/**
 * Comparison hook: product selection, matrix generation, AI verdict loading.
 */
export function useCompare() {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const {
    mutate: compare,
    data: result,
    isPending: isComparing,
    error,
  } = useMutation<ComparisonResult>({
    mutationFn: async () => {
      const res = await fetch(apiUrl("/app/elitescout/api/compare/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: selectedProducts.map((p) => p.id),
          products: selectedProducts,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  const toggleProduct = useCallback((product: Product) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      if (prev.length >= 4) return prev; // Max 4 products
      return [...prev, product];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProducts([]);
  }, []);

  return {
    selectedProducts,
    toggleProduct,
    clearSelection,
    compare,
    result: result ?? null,
    isComparing,
    error: error as Error | null,
    canCompare: selectedProducts.length >= 2,
  };
}
