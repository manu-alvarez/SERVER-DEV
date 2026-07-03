"use client";

import { motion } from "framer-motion";
import { OpportunityBadge } from "@/components/ui/OpportunityBadge";
import TrendChart from "@/components/charts/TrendChart";
import type { Product } from "@/types/schema";

interface BentoProductCardProps {
  product: Product;
  index: number;
  isSelected?: boolean;
  onAnalyze?: (product: Product) => void;
}

/**
 * Premium Bento-style product card with OLED Black glassmorphism.
 * Elite products span 2 columns in the Bento Grid.
 */
export function BentoProductCard({ product, index, isSelected, onAnalyze }: BentoProductCardProps) {
  const isElite = (product as any).isElite === true;
  const themeColor = isElite || product.opportunityScore > 75 ? "gold" : "cyan";

  // Grid span classes for Bento layout
  const spanClass = isElite ? "md:col-span-2 md:row-span-2" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative h-full flex flex-col justify-between overflow-hidden rounded-[24px] transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${spanClass} ${
        isSelected
          ? `ring-2 ring-offset-2 ring-offset-[#050505] ${themeColor === "gold" ? "ring-[#d4a853]/40" : "ring-[#22d3ee]/40"}`
          : "border border-white/[0.06] hover:border-white/20"
      }`}
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* OLED Black inner padding */}
      <div className="p-5 flex flex-col h-full">
        {/* Selection dot */}
        {isSelected && (
          <div className={`absolute top-4 right-4 w-3 h-3 rounded-full z-20 ${themeColor === "gold" ? "bg-[#d4a853]" : "bg-[#22d3ee]"}`}
            style={{ boxShadow: themeColor === "gold" ? "0 0 12px #d4a853" : "0 0 12px #22d3ee" }} />
        )}

        {/* Elite Badge */}
        {isElite && (
          <div className="absolute -top-0.5 -right-0.5 z-10">
            <div className="bg-gradient-to-r from-[#d4a853] to-[#f0d78c] text-[#050505] text-[9px] font-black px-3 py-1 rounded-bl-xl tracking-wider uppercase">
              ★ Mejor Oferta
            </div>
          </div>
        )}

        {/* Travel Pack Badge */}
        {product.isTravelPack && (
          <div className="absolute -top-0.5 -left-0.5 z-10">
            <div className="bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] text-[#050505] text-[9px] font-black px-3 py-1 rounded-br-xl tracking-wider uppercase">
              ✈ Pack Viaje
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start gap-3 mb-3 z-10">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-white leading-tight mb-1 ${isElite ? "text-base line-clamp-3" : "text-sm line-clamp-2"}`}>
              {product.title}
            </h3>
            <span className="text-[10px] font-medium text-white/40 uppercase tracking-[0.15em]">
              {product.source.name}
            </span>
          </div>
          <OpportunityBadge score={product.opportunityScore} size={isElite ? "md" : "sm"} />
        </div>

        {/* Price Block */}
        <div className="flex flex-col gap-2 mb-3 z-10">
          <div className="flex items-baseline gap-2">
            {product.price.current > 0 ? (
              <>
                <span className={`font-black tracking-tight ${isElite ? "text-3xl" : "text-2xl"} ${
                  themeColor === "gold" ? "text-[#d4a853]" : "text-white"
                }`}
                  style={themeColor === "gold" ? { textShadow: "0 0 20px rgba(212,168,83,0.3)" } : {}}
                >
                  {product.price.current.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-[0.6em] ml-0.5">€</span>
                </span>
                {product.isTravelPack && (
                  <span className="text-[10px] text-white/30 uppercase tracking-wider">Total Pack</span>
                )}
              </>
            ) : (
              <span className="text-sm text-white/20 italic">Precio no disponible</span>
            )}
          </div>

          {/* Travel Route Info */}
          {product.isTravelPack && product.travelInfo && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#22d3ee]/10 flex items-center justify-center text-base shrink-0">
                  {product.travelInfo.transportType === "plane" ? "✈️" :
                   product.travelInfo.transportType === "train" ? "🚆" : "🚗"}
                </div>
                {product.travelInfo.origin || product.travelInfo.destination ? (
                  <div className="flex flex-col">
                    <span className="text-[9px] text-white/30 uppercase tracking-[0.2em]">Trayecto</span>
                    <span className="text-xs font-medium text-white line-clamp-1">
                      {product.travelInfo.origin || "?"} → {product.travelInfo.destination || "?"}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-[9px] text-white/30 uppercase tracking-[0.2em]">Destino / Experiencia</span>
                    <span className="text-xs font-medium text-white line-clamp-1">
                      Múltiples destinos / Abierto
                    </span>
                  </div>
                )}
              </div>
              {product.travelInfo.stayDuration && (
                <div className="flex items-center gap-2 text-[10px] text-[#22d3ee]">
                  <span>🏨 Estancia: <b>{product.travelInfo.stayDuration}</b></span>
                </div>
              )}
            </div>
          )}

          {/* Pills: Rating, Shipping */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {product.ratings.score !== null && (
              <div className="flex items-center gap-1 bg-white/[0.04] rounded-full px-2 py-0.5 border border-white/[0.06]">
                <span className="text-[#d4a853] text-[9px]">★</span>
                <span className="text-[10px] text-white font-medium">{product.ratings.score.toFixed(1)}</span>
              </div>
            )}
            {product.shipping.cost === 0 && !product.isTravelPack && (
              <div className="flex items-center gap-1 bg-emerald-500/[0.06] rounded-full px-2 py-0.5 border border-emerald-500/[0.12]">
                <span className="text-emerald-400 text-[10px] font-medium">✓ Envío gratis</span>
              </div>
            )}
            {product.stock === true && (
              <div className="flex items-center gap-1 bg-white/[0.04] rounded-full px-2 py-0.5 border border-white/[0.06]">
                <span className="text-white/60 text-[10px]">En stock</span>
              </div>
            )}
          </div>
        </div>

        {/* Trend Chart */}
        {product.price.current > 0 && !product.isTravelPack && (
          <div className="flex-1 w-full min-h-[50px] relative my-2">
            <TrendChart
              currentPrice={product.price.current}
              history={product.price.historical?.map((p) => p.price)}
              color={themeColor}
              width={isElite ? 400 : 220}
              height={isElite ? 80 : 50}
              showLabels={isElite}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto z-10 pt-3 border-t border-white/[0.04]">
          <button
            onClick={(e) => { e.preventDefault(); onAnalyze?.(product); }}
            className={`flex-1 text-[10px] font-bold tracking-[0.15em] uppercase py-2.5 rounded-xl transition-all duration-300 ${
              themeColor === "gold"
                ? "bg-[#d4a853]/10 text-[#d4a853] hover:bg-[#d4a853]/20 border border-[#d4a853]/15"
                : "bg-[#22d3ee]/10 text-[#22d3ee] hover:bg-[#22d3ee]/20 border border-[#22d3ee]/15"
            }`}
          >
            Analizar Deal
          </button>
          <a
            href={product.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-[10px] font-bold tracking-[0.15em] uppercase py-2.5 rounded-xl bg-white/[0.04] text-white/80 hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-300"
          >
            Ir a oferta
          </a>
        </div>
      </div>

      {/* Background glow orb */}
      <div
        className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[60px] opacity-[0.08] pointer-events-none transition-opacity duration-700 group-hover:opacity-[0.15] ${
          themeColor === "gold" ? "bg-[#d4a853]" : "bg-[#22d3ee]"
        }`}
      />
      {isElite && (
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-[50px] opacity-[0.06] pointer-events-none bg-[#d4a853]" />
      )}
    </motion.div>
  );
}
