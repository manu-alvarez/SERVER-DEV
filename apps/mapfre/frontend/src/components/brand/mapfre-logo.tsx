import { cn } from "@/lib/utils";

export interface MapfreLogoProps {
  variant?: "red" | "white" | "dark";
  showWordmark?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: { clover: 24, text: "text-base" },
  md: { clover: 32, text: "text-xl" },
  lg: { clover: 40, text: "text-2xl" },
  xl: { clover: 56, text: "text-4xl" },
};

export function MapfreLogo({
  variant = "red",
  showWordmark = true,
  className,
  size = "md",
}: MapfreLogoProps) {
  const { clover, text } = sizes[size];

  const cloverColor = variant === "white" ? "#ffffff" : variant === "dark" ? "#0a0a0f" : "#E60028";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={clover}
        height={clover}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path d="M50 50 C50 30, 30 25, 25 35 C20 45, 30 50, 50 50 Z" fill={cloverColor} />
        <path
          d="M50 50 C70 30, 90 25, 95 35 C100 45, 90 50, 50 50 Z"
          fill={cloverColor}
          opacity="0.92"
        />
        <path
          d="M50 50 C50 70, 70 75, 75 65 C80 55, 70 50, 50 50 Z"
          fill={cloverColor}
          opacity="0.85"
        />
        <path
          d="M50 50 C30 70, 10 75, 5 65 C0 55, 10 50, 50 50 Z"
          fill={cloverColor}
          opacity="0.78"
        />
        <circle cx="50" cy="50" r="6" fill={variant === "white" ? "#E60028" : "#ffffff"} />
      </svg>

      {showWordmark && (
        <span
          className={cn(
            "font-bold lowercase tracking-tight leading-none",
            text,
            variant === "white"
              ? "text-white"
              : variant === "dark"
                ? "text-foreground"
                : "text-[#E60028]",
          )}
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          mapfre
        </span>
      )}
    </div>
  );
}

export function MapfreLogoSymbol({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-2xl bg-[#E60028] shadow-lg shadow-[#E60028]/30",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.65}
        height={size * 0.65}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M50 50 C50 30, 30 25, 25 35 C20 45, 30 50, 50 50 Z" fill="white" />
        <path d="M50 50 C70 30, 90 25, 95 35 C100 45, 90 50, 50 50 Z" fill="white" opacity="0.9" />
        <path d="M50 50 C50 70, 70 75, 75 65 C80 55, 70 50, 50 50 Z" fill="white" opacity="0.85" />
        <path d="M50 50 C30 70, 10 75, 5 65 C0 55, 10 50, 50 50 Z" fill="white" opacity="0.8" />
      </svg>
    </div>
  );
}
