"use client";

type MediaMode = "image" | "video";

interface MediaToggleProps {
  mode: MediaMode;
  onChange: (mode: MediaMode) => void;
  videoAvailable?: boolean;
}

export default function MediaToggle({
  mode,
  onChange,
  videoAvailable = false,
}: MediaToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
      <button
        onClick={() => onChange("image")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
          mode === "image"
            ? "bg-amber-500 text-white shadow-sm"
            : "text-slate-300 hover:text-white hover:bg-white/5"
        }`}
      >
        <span>🎨</span>
        Imagen
      </button>
      <button
        onClick={() => onChange("video")}
        disabled={!videoAvailable}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
          !videoAvailable
            ? "text-slate-500 cursor-not-allowed"
            : mode === "video"
            ? "bg-orange-500 text-white shadow-sm"
            : "text-slate-300 hover:text-white hover:bg-white/5"
        }`}
      >
        <span>🎬</span>
        Video
        {!videoAvailable && <span className="text-[9px]">(pro)</span>}
      </button>
    </div>
  );
}
