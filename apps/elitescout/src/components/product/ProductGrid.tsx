"use client";

import { ProductCard } from "./ProductCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import type { Product } from "@/types/schema";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  selectedIds?: Set<string>;
  onSelectProduct?: (product: Product) => void;
}

/**
 * Responsive product grid with loading skeletons.
 */
export function ProductGrid({
  products,
  isLoading,
  selectedIds,
  onSelectProduct,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard count={6} />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4 opacity-30">🔍</div>
        <h3 className="text-lg font-semibold text-text-secondary mb-2">
          Sin resultados
        </h3>
        <p className="text-sm text-text-muted max-w-md">
          No se encontraron productos para esta búsqueda. Prueba con otros términos o ajusta los filtros.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          index={i}
          isSelected={selectedIds?.has(product.id)}
          onSelect={onSelectProduct}
        />
      ))}
    </div>
  );
}
