"use client";

interface SkeletonCardProps {
  count?: number;
}

/**
 * Premium skeleton loading cards with shimmer animation.
 */
export function SkeletonCard({ count = 1 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass rounded-[16px] p-5 space-y-4"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          {/* Title */}
          <div className="skeleton h-5 w-3/4 rounded-md" />
          {/* Description */}
          <div className="space-y-2">
            <div className="skeleton h-3 w-full rounded-md" />
            <div className="skeleton h-3 w-5/6 rounded-md" />
          </div>
          {/* Price + Badge */}
          <div className="flex items-center justify-between">
            <div className="skeleton h-7 w-24 rounded-md" />
            <div className="skeleton h-8 w-16 rounded-full" />
          </div>
          {/* Footer */}
          <div className="flex items-center gap-3 pt-2">
            <div className="skeleton h-4 w-20 rounded-md" />
            <div className="skeleton h-4 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </>
  );
}
