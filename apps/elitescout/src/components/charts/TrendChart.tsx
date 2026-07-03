"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface TrendChartProps {
  /** Current price — used to generate the trend if no history exists */
  currentPrice: number;
  /** Optional historical prices [oldest → newest] */
  history?: number[];
  /** Chart width */
  width?: number;
  /** Chart height */
  height?: number;
  /** Show price labels */
  showLabels?: boolean;
  /** Accent color */
  color?: "cyan" | "gold" | "green" | "red";
}

const COLORS = {
  cyan: { stroke: "#22d3ee", fill: "rgba(34,211,238,0.08)", glow: "rgba(34,211,238,0.3)" },
  gold: { stroke: "#d4a853", fill: "rgba(212,168,83,0.08)", glow: "rgba(212,168,83,0.3)" },
  green: { stroke: "#22c55e", fill: "rgba(34,197,94,0.08)", glow: "rgba(34,197,94,0.3)" },
  red: { stroke: "#ef4444", fill: "rgba(239,68,68,0.08)", glow: "rgba(239,68,68,0.3)" },
};

/**
 * SVG Trend Chart with animated Bezier curves.
 * Generates a visually attractive price trend from historical data or simulated data.
 */
export default function TrendChart({
  currentPrice,
  history,
  width = 200,
  height = 60,
  showLabels = false,
  color = "cyan",
}: TrendChartProps) {
  const palette = COLORS[color];

  const points = useMemo(() => {
    if (history && history.length >= 3) {
      return history;
    }

    // Generate aesthetic simulated trend (subtle downward for "deal" feel)
    const base = currentPrice;
    const variance = base * 0.15;
    return [
      base + variance * 0.8,
      base + variance * 1.1,
      base + variance * 0.5,
      base + variance * 0.9,
      base + variance * 0.3,
      base - variance * 0.1,
      base - variance * 0.2,
      currentPrice,
    ];
  }, [currentPrice, history]);

  // Normalize points to SVG coordinates
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const minPrice = Math.min(...points);
  const maxPrice = Math.max(...points);
  const range = maxPrice - minPrice || 1;

  const coords = points.map((p, i) => ({
    x: padding + (i / (points.length - 1)) * chartWidth,
    y: padding + chartHeight - ((p - minPrice) / range) * chartHeight,
  }));

  // Generate smooth Bezier curve path
  const linePath = useMemo(() => {
    if (coords.length < 2) return "";

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
      const cpx2 = curr.x - (curr.x - prev.x) * 0.4;
      d += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [coords]);

  // Fill area path (line + bottom close)
  const fillPath = useMemo(() => {
    if (!linePath) return "";
    const last = coords[coords.length - 1];
    const first = coords[0];
    return `${linePath} L ${last.x} ${height - padding} L ${first.x} ${height - padding} Z`;
  }, [linePath, coords, height]);

  const isDowntrend = points[points.length - 1] < points[0];

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`trend-fill-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.fill} stopOpacity={0.8} />
            <stop offset="100%" stopColor={palette.fill} stopOpacity={0} />
          </linearGradient>
          <filter id={`glow-${color}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Fill area */}
        <motion.path
          d={fillPath}
          fill={`url(#trend-fill-${color})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />

        {/* Main line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={palette.stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
          filter={`url(#glow-${color})`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Current price dot (pulse) */}
        {coords.length > 0 && (
          <motion.circle
            cx={coords[coords.length - 1].x}
            cy={coords[coords.length - 1].y}
            r={3}
            fill={palette.stroke}
            filter={`url(#glow-${color})`}
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </svg>

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between mt-1" style={{ width }}>
          <span className="text-[9px] text-text-muted">
            {Math.round(maxPrice)}€
          </span>
          <span
            className={`text-[9px] font-semibold ${isDowntrend ? "text-green-400" : "text-red-400"}`}
          >
            {isDowntrend ? "↓" : "↑"} {Math.round(currentPrice)}€
          </span>
        </div>
      )}
    </div>
  );
}
