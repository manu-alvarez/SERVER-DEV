"use client";

import { motion } from "framer-motion";
import type { CouponCode } from "@/types/schema";

interface CouponCardProps {
  coupon: CouponCode;
}

/**
 * Coupon code card with copy-to-clipboard and discount display.
 */
export function CouponCard({ coupon }: CouponCardProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code);
  };

  return (
    <motion.div
      className="glass-gold rounded-xl p-3 flex items-center justify-between gap-3"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-gold font-mono font-bold text-sm tracking-wider">
            {coupon.code}
          </span>
          {coupon.verified && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
              ✓ Verificado
            </span>
          )}
        </div>
        <div className="text-[11px] text-text-muted mt-0.5 truncate">
          {coupon.discountPercent
            ? `${coupon.discountPercent}% descuento`
            : coupon.discountAmount
            ? `${coupon.discountAmount}€ descuento`
            : "Descuento disponible"}{" "}
          · {coupon.sourceName}
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="px-3 py-1.5 rounded-lg bg-gold/10 text-gold text-xs font-semibold hover:bg-gold/20 transition-colors shrink-0"
        title="Copiar código"
      >
        Copiar
      </button>
    </motion.div>
  );
}
