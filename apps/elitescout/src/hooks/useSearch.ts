"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect } from "react";
import type { SearchFilters, SearchResponse } from "@/types/schema";
import { apiUrl } from "@/lib/api";

/**
 * Search hook: debounced input, cached results, layer status tracking.
 */
export interface SearchOptions {
  initialQuery?: string;
  type?: "product" | "travel";
  origin?: string;
  destination?: string;
  transportMode?: "plane" | "train" | "car";
}

export function useSearch(options: SearchOptions = {}) {
  const [query, setQuery] = useState(options.initialQuery || "");
  const [submittedQuery, setSubmittedQuery] = useState(options.initialQuery || "");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedLayers, setSelectedLayers] = useState<(1 | 2 | 3)[]>([1, 2, 3]);
  const initialized = useRef(false);

  // Auto-submit on init if initialQuery provided
  useEffect(() => {
    if (options.initialQuery && !initialized.current) {
      initialized.current = true;
      setQuery(options.initialQuery);
      setSubmittedQuery(options.initialQuery);
    }
  }, [options.initialQuery]);

  const { data, isLoading, error, refetch } = useQuery<SearchResponse>({
    queryKey: ["search", submittedQuery, filters, selectedLayers, options.type, options.origin, options.destination, options.transportMode],
    queryFn: async () => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (typeof window !== "undefined") {
        const gmToken = localStorage.getItem("godmode_token");
        const customKeys = localStorage.getItem("user_custom_keys");
        if (gmToken) headers["x-godmode-token"] = gmToken;
        if (customKeys) headers["x-user-custom-keys"] = customKeys;
      }

      const res = await fetch(apiUrl("/app/elitescout/api/search/"), {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          query: submittedQuery, 
          filters, 
          layers: selectedLayers,
          type: options.type,
          origin: options.origin,
          destination: options.destination,
          transportMode: options.transportMode
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    enabled: !!submittedQuery,
  });

  const executeSearch = useCallback((directQuery?: string) => {
    const q = directQuery?.trim() || query.trim();
    if (q) {
      setQuery(q);
      setSubmittedQuery(q);
    }
  }, [query]);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    selectedLayers,
    setSelectedLayers,
    results: data ?? null,
    isLoading,
    error: error as Error | null,
    executeSearch,
    refetch,
  };
}
