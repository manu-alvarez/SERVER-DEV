"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSearch } from "@/hooks/useSearch";
import { useCompare } from "@/hooks/useCompare";
import { SearchBar } from "@/components/search/SearchBar";
import { BentoGrid } from "@/components/ui/BentoGrid";
import { LayerIndicator } from "@/components/ui/LayerIndicator";
import { ComparisonTable } from "@/components/compare/ComparisonTable";
import { AIVerdict } from "@/components/compare/AIVerdict";
import { CouponCard } from "@/components/ui/CouponCard";

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const type = (searchParams.get("type") as "product" | "travel") || "product";
  const origin = searchParams.get("origin") || "";
  const dest = searchParams.get("dest") || "";
  const mode = (searchParams.get("mode") as "plane" | "train" | "car") || "plane";

  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    executeSearch,
  } = useSearch({
    initialQuery,
    type,
    origin,
    destination: dest,
    transportMode: mode,
  });

  const {
    selectedProducts,
    toggleProduct,
    clearSelection,
    compare,
    result: comparisonResult,
    isComparing,
    canCompare,
  } = useCompare();

  const [sortBy, setSortBy] = useState<"score" | "price" | "rating">("score");
  const [showComparison, setShowComparison] = useState(false);

  // Sort products
  const sortedProducts = useMemo(() => {
    if (!results?.products) return [];
    const sorted = [...results.products];
    switch (sortBy) {
      case "price":
        return sorted.sort((a, b) => a.price.current - b.price.current);
      case "rating":
        return sorted.sort((a, b) => (b.ratings.score ?? 0) - (a.ratings.score ?? 0));
      case "score":
      default:
        return sorted.sort((a, b) => b.opportunityScore - a.opportunityScore);
    }
  }, [results?.products, sortBy]);

  const selectedIds = useMemo(
    () => new Set(selectedProducts.map((p) => p.id)),
    [selectedProducts]
  );

  const handleSearch = () => {
    executeSearch();
    router.replace(`/results?q=${encodeURIComponent(query)}`);
  };

  const handleCompare = () => {
    compare();
    setShowComparison(true);
  };

  return (
    <div className="min-h-screen pt-6 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="mb-8">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
        />
      </div>

      {/* Layer Status + Sort Controls */}
      {results && (
        <motion.div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {results.layers.map((l) => (
              <LayerIndicator
                key={l.layer}
                layer={l.layer}
                status={l.status}
                resultCount={l.resultCount}
              />
            ))}
            <span className="text-[10px] text-text-muted ml-2">
              {results.totalResults} resultados · {(results.searchTime / 1000).toFixed(1)}s
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="flex items-center gap-1.5">
              {(["score", "price", "rating"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg transition-all ${
                    sortBy === s
                      ? "bg-gold/10 text-gold font-semibold"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {{ score: "Oportunidad", price: "Precio", rating: "Rating" }[s]}
                </button>
              ))}
            </div>

            {/* Compare button */}
            {canCompare && (
              <motion.button
                onClick={handleCompare}
                className="px-4 py-1.5 rounded-xl bg-cyan/10 text-cyan text-xs font-semibold hover:bg-cyan/20 transition-colors"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileTap={{ scale: 0.95 }}
              >
                Comparar ({selectedProducts.length})
              </motion.button>
            )}
            {selectedProducts.length > 0 && (
              <button
                onClick={clearSelection}
                className="text-[10px] text-text-muted hover:text-red-400 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="glass rounded-xl p-4 mb-6 border-red-500/10">
          <p className="text-sm text-red-400">{error.message}</p>
        </div>
      )}

      {/* Comparison Panel */}
      {showComparison && comparisonResult && (
        <motion.div
          className="mb-8 space-y-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Matriz Comparativa
            </h2>
            <button
              onClick={() => setShowComparison(false)}
              className="text-xs text-text-muted hover:text-foreground transition-colors"
            >
              Cerrar ✕
            </button>
          </div>
          <div className="glass rounded-2xl p-4 overflow-hidden">
            <ComparisonTable result={comparisonResult} />
          </div>
          <AIVerdict
            verdict={comparisonResult.aiVerdict}
            reasons={comparisonResult.winner.reasons}
            isLoading={isComparing}
          />
        </motion.div>
      )}

      {/* Loading comparison */}
      {isComparing && !comparisonResult && (
        <div className="mb-8">
          <AIVerdict verdict="" reasons={[]} isLoading />
        </div>
      )}

      {/* Coupons */}
      {results && results.coupons.length > 0 && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">
            🎟️ Cupones encontrados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.coupons.map((c, i) => (
              <CouponCard key={`${c.code}-${i}`} coupon={c} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[340px]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-full w-full rounded-[24px]" />
          ))}
        </div>
      ) : (
        <BentoGrid
          products={sortedProducts}
          onAnalyze={toggleProduct}
        />
      )}

      {/* Selection hint */}
      {results && results.products.length > 0 && selectedProducts.length === 0 && (
        <motion.p
          className="text-center text-[11px] text-text-muted mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          💡 Selecciona 2-4 productos para compararlos con IA
        </motion.p>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
