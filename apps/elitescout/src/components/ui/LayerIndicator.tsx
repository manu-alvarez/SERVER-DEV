"use client";

interface LayerIndicatorProps {
  layer: 1 | 2 | 3;
  status: "idle" | "searching" | "done" | "error";
  resultCount: number;
}

const LAYER_META = {
  1: { label: "Web", icon: "🌐", description: "Búsqueda general" },
  2: { label: "Tiendas", icon: "🏪", description: "Marketplaces" },
  3: { label: "Reseñas", icon: "💬", description: "Sentimiento" },
};

/**
 * Layer search depth badge — shows which search layers returned results.
 */
export function LayerIndicator({ layer, status, resultCount }: LayerIndicatorProps) {
  const meta = LAYER_META[layer];

  const statusStyles = {
    idle: "opacity-40",
    searching: "animate-pulse-glow border-cyan/30",
    done: "border-gold/20",
    error: "border-red-500/20 opacity-60",
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/5 text-xs ${statusStyles[status]}`}
      title={`${meta.description}: ${resultCount} resultados`}
    >
      <span>{meta.icon}</span>
      <span className="text-text-secondary font-medium">{meta.label}</span>
      {status === "done" && resultCount > 0 && (
        <span className="text-gold font-semibold">{resultCount}</span>
      )}
      {status === "searching" && (
        <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
      )}
      {status === "error" && <span className="text-red-400">✕</span>}
    </div>
  );
}
