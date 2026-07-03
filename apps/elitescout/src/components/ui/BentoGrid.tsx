"use client";

import type { Product } from "@/types/schema";
import { BentoProductCard } from "@/components/product/BentoProductCard";

interface BentoGridProps {
  products: Product[];
  selectedIds?: Set<string>;
  onAnalyze?: (product: Product) => void;
}

/**
 * Premium Bento Grid — OLED Black aesthetic with dynamic row heights.
 * Elite products span 2 columns, creating visual hierarchy.
 */
export function BentoGrid({ products, selectedIds, onAnalyze }: BentoGridProps) {
  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[250px]">
      {products.map((product, index) => {
        const isElite = (product as any).isElite === true;

        const spanClasses = isElite
          ? "md:col-span-2 md:row-span-2"
          : "col-span-1 row-span-1";

        return (
          <div key={product.id} className={spanClasses}>
            <BentoProductCard
              product={product}
              index={index}
              isSelected={selectedIds?.has(product.id)}
              onAnalyze={onAnalyze}
            />
          </div>
        );
      })}
    </div>
  );
}
