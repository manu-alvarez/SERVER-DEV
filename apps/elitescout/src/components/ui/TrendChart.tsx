"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface TrendChartProps {
  currentPrice: number;
  historicalPrices?: number[];
  color?: "gold" | "cyan";
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Native SVG chart with Framer Motion path animation.
 * Features a gradient fill and "Tech Luxury" glow.
 */
export function TrendChart({
  currentPrice,
  historicalPrices,
  color = "gold",
  className = "",
  width = 200,
  height = 60,
}: TrendChartProps) {
  // Generate simulated data if none is provided
  const data = useMemo(() => {
    if (historicalPrices && historicalPrices.length > 3) {
      return historicalPrices;
    }

    // Simulate 7 data points leading to currentPrice
    // Prices shouldn't vary by more than 20%
    const simulated = [];
    let current = currentPrice * 1.15; // Start 15% higher (simulating a drop)
    
    for (let i = 0; i < 6; i++) {
      simulated.push(current);
      // Random walk down towards current price
      const drop = current * (Math.random() * 0.05 + 0.01);
      current = Math.max(current - drop, currentPrice);
    }
    simulated.push(currentPrice);
    
    return simulated;
  }, [currentPrice, historicalPrices]);

  // Calculate SVG path
  const pathData = useMemo(() => {
    if (data.length === 0) return { path: "", points: [] };

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const paddingX = 4;
    const paddingY = 8;
    const usableWidth = width - paddingX * 2;
    const usableHeight = height - paddingY * 2;
    
    const points = data.map((val, i) => {
      const x = paddingX + (i / (data.length - 1)) * usableWidth;
      const normalizedY = (val - min) / range;
      // Invert Y axis because SVG 0,0 is top-left
      const y = paddingY + (1 - normalizedY) * usableHeight;
      return { x, y };
    });

    // Create a smooth cubic bezier curve
    // Simple smoothing: control points horizontally halfway to the next point
    let path = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      const cp1X = current.x + (next.x - current.x) / 2;
      const cp1Y = current.y;
      
      const cp2X = current.x + (next.x - current.x) / 2;
      const cp2Y = next.y;
      
      path += ` C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${next.x},${next.y}`;
    }

    return { path, points };
  }, [data, width, height]);

  // Generate fill path (closes the shape at the bottom)
  const fillPath = useMemo(() => {
    if (!pathData.path) return "";
    return `${pathData.path} L ${width - 4},${height} L 4,${height} Z`;
  }, [pathData, width, height]);

  const strokeColor = color === "gold" ? "#D4AF37" : "#00E5FF";
  const glowId = `glow-${Math.random().toString(36).substring(2, 9)}`;
  const gradientId = `grad-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <defs>
          {/* Drop shadow / Glow filter */}
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Gradient Fill */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Fill Area (fades in) */}
        <motion.path
          d={fillPath}
          fill={`url(#${gradientId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        />

        {/* The Line (draws itself) */}
        <motion.path
          d={pathData.path}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ 
            pathLength: { duration: 1.5, ease: "easeInOut" },
            opacity: { duration: 0.2 }
          }}
        />
        
        {/* Current price dot */}
        {pathData.points && pathData.points.length > 0 && (
          <motion.circle
            cx={pathData.points[pathData.points.length - 1].x}
            cy={pathData.points[pathData.points.length - 1].y}
            r="3"
            fill={strokeColor}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.4, type: "spring" }}
            className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          />
        )}
      </svg>
    </div>
  );
}
