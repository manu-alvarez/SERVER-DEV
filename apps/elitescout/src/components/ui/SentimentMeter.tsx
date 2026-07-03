"use client";

interface SentimentMeterProps {
  positive: number;
  negative: number;
  neutral: number;
  compact?: boolean;
}

/**
 * Sentiment gauge visualization — positive/negative/neutral bar.
 */
export function SentimentMeter({
  positive,
  negative,
  neutral,
  compact = false,
}: SentimentMeterProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden flex">
          <div
            className="h-full bg-emerald-400/80 transition-all"
            style={{ width: `${positive}%` }}
          />
          <div
            className="h-full bg-white/10 transition-all"
            style={{ width: `${neutral}%` }}
          />
          <div
            className="h-full bg-red-400/80 transition-all"
            style={{ width: `${negative}%` }}
          />
        </div>
        <span className="text-[10px] text-text-muted">{positive}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden flex">
        <div
          className="h-full bg-emerald-400/80 transition-all duration-500"
          style={{ width: `${positive}%` }}
        />
        <div
          className="h-full bg-white/10 transition-all duration-500"
          style={{ width: `${neutral}%` }}
        />
        <div
          className="h-full bg-red-400/80 transition-all duration-500"
          style={{ width: `${negative}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-text-muted">
        <span className="text-emerald-400">👍 {positive}%</span>
        <span>⚖️ {neutral}%</span>
        <span className="text-red-400">👎 {negative}%</span>
      </div>
    </div>
  );
}
