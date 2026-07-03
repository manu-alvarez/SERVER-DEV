"use client";

import { motion } from "framer-motion";
import type { ComparisonResult } from "@/types/schema";

interface ComparisonTableProps {
  result: ComparisonResult;
}

/**
 * Dynamic comparison matrix table with winner highlighting.
 */
export function ComparisonTable({ result }: ComparisonTableProps) {
  const { products, matrix, winner } = result;

  return (
    <motion.div
      className="overflow-x-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider p-3 border-b border-white/5">
              Métrica
            </th>
            {products.map((p) => (
              <th
                key={p.id}
                className={`text-left text-xs font-semibold p-3 border-b min-w-[160px] ${
                  p.id === winner.productId
                    ? "text-gold border-gold/20"
                    : "text-text-secondary border-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  {p.id === winner.productId && (
                    <span className="text-gold text-sm">👑</span>
                  )}
                  <span className="truncate">{p.title}</span>
                </div>
                <div className="text-[10px] text-text-muted font-normal mt-0.5">
                  {p.source.name}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <motion.tr
              key={row.metric}
              className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <td className="text-xs font-medium text-text-secondary p-3">
                {row.metric}
              </td>
              {products.map((p) => (
                <td
                  key={p.id}
                  className={`text-sm p-3 font-medium ${
                    p.id === row.winnerId
                      ? "text-gold"
                      : "text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {p.id === row.winnerId && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                    )}
                    {String(row.values[p.id] ?? "N/A")}
                  </div>
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
