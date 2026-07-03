"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { OpportunityBadge } from "@/components/ui/OpportunityBadge";
import { SentimentMeter } from "@/components/ui/SentimentMeter";
import type { Product } from "@/types/schema";

interface ProductCardProps {
  product: Product;
  index: number;
  isSelected?: boolean;
  onSelect?: (product: Product) => void;
}

/**
 * Premium product card with glassmorphism, score badge, and selection state.
 */
export function ProductCard({ product, index, isSelected, onSelect }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
    >
      <GlassCard
        variant={isSelected ? "gold" : "default"}
        className={`relative group transition-all duration-300 ${
          isSelected ? "glow-gold ring-1 ring-gold/20" : ""
        }`}
        onClick={() => onSelect?.(product)}
      >
        {/* Selection indicator */}
        {onSelect && (
          <div
            className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected
                ? "border-gold bg-gold/20"
                : "border-white/10 group-hover:border-white/20"
            }`}
          >
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2.5 h-2.5 rounded-full bg-gold"
              />
            )}
          </div>
        )}

        {/* Header: Title + Source */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate leading-tight">
              {product.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
                {product.source.name}
              </span>
              <span className="text-[10px] text-text-muted">·</span>
              <LayerDot layer={product.source.layer} />
            </div>
          </div>
          <OpportunityBadge score={product.opportunityScore} size="sm" />
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-text-secondary line-clamp-2 mb-3 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Price + Shipping */}
        <div className="flex items-end justify-between mb-3">
          <div>
            {product.price.current > 0 ? (
              <>
                <span className="text-lg font-bold text-foreground">
                  {product.price.current.toFixed(2)}
                </span>
                <span className="text-xs text-text-muted ml-1">
                  {product.price.currency}
                </span>
                {product.price.lowestEver && product.price.lowestEver < product.price.current && (
                  <div className="text-[10px] text-cyan mt-0.5">
                    Mín. histórico: {product.price.lowestEver.toFixed(2)}€
                  </div>
                )}
              </>
            ) : (
              <span className="text-sm text-text-muted italic">Precio no disponible</span>
            )}
          </div>
          <div className="text-right">
            {product.shipping.cost !== null && product.shipping.cost === 0 && product.source.layer >= 2 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                Envío gratis
              </span>
            ) : product.shipping.cost !== null && product.shipping.cost > 0 ? (
              <span className="text-[10px] text-text-muted">
                +{product.shipping.cost.toFixed(2)}€ envío
              </span>
            ) : null}
          </div>
        </div>

        {/* Rating + Sentiment */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            {product.ratings.score !== null && (
              <div className="flex items-center gap-1">
                <span className="text-gold text-xs">★</span>
                <span className="text-xs font-medium text-foreground">
                  {product.ratings.score.toFixed(1)}
                </span>
                {product.ratings.count > 0 && (
                  <span className="text-[10px] text-text-muted">
                    ({product.ratings.count})
                  </span>
                )}
              </div>
            )}
            {product.stock === false && (
              <span className="text-[10px] text-red-400 font-medium">Agotado</span>
            )}
          </div>

          {product.ratings.sentiment && (
            <SentimentMeter
              positive={product.ratings.sentiment.positive}
              negative={product.ratings.sentiment.negative}
              neutral={product.ratings.sentiment.neutral}
              compact
            />
          )}
        </div>

        {/* External link */}
        {product.source.url && (
          <a
            href={product.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center text-[11px] text-cyan/70 hover:text-cyan transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Ver en {product.source.name} →
          </a>
        )}
      </GlassCard>
    </motion.div>
  );
}

function LayerDot({ layer }: { layer: 1 | 2 | 3 }) {
  const colors = { 1: "bg-blue-400", 2: "bg-emerald-400", 3: "bg-amber-400" };
  const labels = { 1: "Web", 2: "Tienda", 3: "Reseña" };
  return (
    <span className="flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full ${colors[layer]}`} />
      <span className="text-[10px] text-text-muted">{labels[layer]}</span>
    </span>
  );
}
