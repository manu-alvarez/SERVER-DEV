"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { playBubble, playSpell, playChime, playWand } from "@/lib/sound";

interface Chapter {
  id: string;
  chapter_number: number;
  chapter_title: string;
  chapter_text: string;
  url_image?: string | null;
  url_audio?: string | null;
  url_video?: string | null;
  image_status: string;
  audio_status: string;
  video_status: string;
}

interface Story {
  id: string;
  title: string;
  child_name: string;
  child_age: number;
  status: string;
  error_message?: string | null;
  text_generated: boolean;
  images_generated: boolean;
  audio_generated: boolean;
  video_generated: boolean;
  url_video?: string | null;
  video_status?: string;
}

interface StoryPlayerProps {
  story: Story;
  chapters: Chapter[];
}

export default function StoryPlayer({ story, chapters }: StoryPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaMode, setMediaMode] = useState<"image" | "video">("image");
  const [viewMode, setViewMode] = useState<"book" | "theater">("book");
  const [isPlaying, setIsPlaying] = useState(false);
  const [localChapters, setLocalChapters] = useState<Chapter[]>(chapters);
  const [progress, setProgress] = useState<{
    status: string;
    chapters_completed: number;
    chapters_total: number;
    estimated_remaining_seconds?: number | null;
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const printRef = useRef<HTMLDivElement>(null!);

  const current = localChapters[currentIndex] || null;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:8007` : "http://localhost:8007");

  const [retrying, setRetrying] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null!);

  const hasFailedChapters = localChapters.some(
    (ch) => ch.image_status === "failed" || ch.audio_status === "failed"
  );

  // Rotating tips for the loading screen
  const magicalTips = [
    "Varita está espolvoreando polvo de estrellas sobre tu historia... ✨",
    "Los duendes mágicos están mezclando los colores de tus dibujos... 🎨",
    "La reina de las hadas está afinando los instrumentos musicales... 🎙️",
    "El sabio dragón está ordenando las páginas del libro mágico... 🐉",
    "¡Abracadabra! Los unicornios están bailando para dar energía a las animaciones... 🦄",
    "Preparando hechizos de risa y diversión para tu cuento... 😂🪄"
  ];
  const [tipIndex, setTipIndex] = useState(0);

  // Confetti celebration trigger
  const triggerConfetti = () => {
    if (typeof window === "undefined") return;
    const colors = ["#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#ef4444"];
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100vw";
    container.style.height = "100vh";
    container.style.pointerEvents = "none";
    container.style.zIndex = "9999";
    document.body.appendChild(container);

    for (let i = 0; i < 60; i++) {
      const p = document.createElement("div");
      p.className = "confetti-particle";
      p.style.left = `${Math.random() * 100}vw`;
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      p.style.width = `${Math.random() * 8 + 6}px`;
      p.style.height = `${Math.random() * 12 + 6}px`;
      p.style.borderRadius = "2px";
      p.style.setProperty("--fall-duration", `${Math.random() * 3 + 2.5}s`);
      p.style.animationDelay = `${Math.random() * 2}s`;
      container.appendChild(p);
    }

    setTimeout(() => {
      container.remove();
    }, 6000);
  };

  // Format remaining time
  const formatRemainingTime = (seconds: number | undefined | null) => {
    if (!seconds || seconds <= 0) return null;
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  // Resolve media URLs: prepend API base for local storage paths
  const resolveMediaUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${apiBase}${url}`;
  };

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    playSpell();
    try {
      const res = await fetch(`${apiBase}/api/stories/${story.id}/retry`, {
        method: "POST",
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch {
      setRetrying(false);
    }
  }, [story.id, apiBase]);

  const isProcessing =
    story.status === "pending" ||
    story.status === "text_pending" ||
    story.status === "processing" ||
    story.status === "text_ready";

  // Poll for progress updates and refresh chapter data
  useEffect(() => {
    if (!isProcessing) return;

    const poll = async () => {
      try {
        const res = await fetch(`${apiBase}/api/stories/${story.id}/progress`);
        if (res.ok) {
          const data = await res.json();
          setProgress(data);

          if (data.status !== "Ready" && data.status !== "Failed") {
            const storyRes = await fetch(`${apiBase}/api/stories/${story.id}`);
            if (storyRes.ok) {
              const storyData = await storyRes.json();
              setLocalChapters(storyData.chapters || []);
            }
          }

          if (data.status === "Ready" || data.status === "ready") {
            window.location.reload();
          }
        }
      } catch {
        // Ignore polling errors
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [story.id, isProcessing, apiBase]);

  // Loading screen tip rotator
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % magicalTips.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isProcessing, magicalTips.length]);

  // Trigger confetti once on successful creation mount
  useEffect(() => {
    if (!isProcessing && story.status === "ready") {
      triggerConfetti();
    }
  }, [isProcessing, story.status]);

  // Close print dropdown on outside click
  useEffect(() => {
    if (!printOpen) return;
    const handler = (e: MouseEvent) => {
      if (printRef.current && !printRef.current.contains(e.target as Node)) {
        setPrintOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [printOpen]);

  // Auto-play audio when chapter changes
  useEffect(() => {
    if (audioRef.current && current?.url_audio) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [currentIndex, current?.url_audio]);

  const toggleAudio = useCallback(() => {
    if (!audioRef.current || !current?.url_audio) return;

    if (isPlaying) {
      audioRef.current.pause();
      playBubble();
    } else {
      audioRef.current.play().catch(() => {});
      playChime();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, current?.url_audio]);

  const goPrev = () => {
    playBubble();
    setCurrentIndex((i) => Math.max(0, i - 1));
  };
  const goNext = () => {
    playBubble();
    setCurrentIndex((i) => Math.min(localChapters.length - 1, i + 1));
  };

  const handleMediaToggle = (mode: "image" | "video") => {
    playWand();
    setMediaMode(mode);
  };

  const handleViewToggle = (mode: "book" | "theater") => {
    playChime();
    setViewMode(mode);
  };

  // Auto-switch to image mode if current chapter has no video
  useEffect(() => {
    if (mediaMode === "video" && !story.url_video && story.video_status !== "processing" && story.video_status !== "pending") {
      // Don't stay on empty "No hay cine" — gracefully fall back
    }
  }, [mediaMode, story, currentIndex]);

  // Close download dropdown on outside click
  useEffect(() => {
    if (!downloadOpen) return;
    const handler = (e: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) {
        setDownloadOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [downloadOpen]);

  /** Download helper: fetches a media URL and triggers save-as dialog */
  const downloadFile = async (url: string, filename: string) => {
    try {
      const resolved = resolveMediaUrl(url);
      if (!resolved) return;
      const res = await fetch(resolved);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  /** Download all assets for a given mode */
  const downloadAll = async (mode: "story" | "video") => {
    playChime();
    setDownloadOpen(false);
    const title = (story.title || "cuento").replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, "").replace(/ +/g, "_");
    
    if (mode === "video" && story.url_video) {
      await downloadFile(story.url_video, `${title}_pelicula.mp4`);
      return;
    }

    if (mode === "story") {
      // Generate text file
      let storyText = `${story.title || "Cuento Mágico"}\n\n`;
      for (const ch of localChapters) {
        storyText += `Capítulo ${ch.chapter_number}: ${ch.chapter_title}\n`;
        storyText += `${ch.chapter_text}\n\n`;
      }
      const blob = new Blob([storyText], { type: "text/plain;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${title}_texto.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);

      // Download media
      for (const ch of localChapters) {
        const num = ch.chapter_number;
        if (ch.url_image) await downloadFile(ch.url_image, `${title}_cap${num}.png`);
        if (ch.url_audio) await downloadFile(ch.url_audio, `${title}_cap${num}.mp3`);
      }
    }
  };

  if (isProcessing) {
    return (
      <div className="max-w-2xl mx-auto rounded-3xl border-4 border-dashed border-amber-500/40 bg-amber-950/40 backdrop-blur-xl p-8 md:p-12 text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] relative overflow-hidden">
        {/* Decorative sparkles */}
        <div className="absolute top-4 left-4 text-2xl animate-pulse">✨</div>
        <div className="absolute top-12 right-6 text-xl animate-bounce">⭐</div>
        <div className="absolute bottom-6 left-12 text-xl animate-bounce delay-300">🪄</div>
        <div className="absolute bottom-4 right-4 text-2xl animate-pulse delay-500">🌟</div>

        {/* Wizard Mascot Animation */}
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-300 via-orange-400 to-amber-500 rounded-full flex items-center justify-center text-5xl shadow-[0_8px_30px_rgba(245,158,11,0.4)] border-2 border-white animate-bounce-gentle">
          🧙‍♂️✨
        </div>

        <h2 className="text-2xl md:text-3xl font-black font-kid-title text-amber-300 mb-2 tracking-tight">
          ¡Creando tu Cuento Mágico!
        </h2>
        <p className="text-amber-100/80 font-kid-body text-sm md:text-base max-w-md mx-auto mb-8">
          La IA y los duendes mágicos están tejiendo las páginas del cuento personalizado para <span className="font-bold text-white">&quot;{story.child_name}&quot;</span>.
        </p>

        {/* Fun Rotating Tip Box */}
        <div className="bg-amber-900/40 border border-amber-500/20 rounded-2xl p-4 max-w-md mx-auto mb-8 min-h-[70px] flex items-center justify-center transition-all duration-500 transform hover:scale-102">
          <p className="text-xs md:text-sm text-amber-200/90 font-medium font-kid-body leading-relaxed">
            {magicalTips[tipIndex]}
          </p>
        </div>

        {progress && (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="flex justify-between text-xs font-bold text-amber-200/80 font-kid-title">
              <span>PROGRESO DE LA AVENTURA</span>
              <span className="text-amber-300">{progress.status}</span>
            </div>

            {/* Glowing Custom Progress Bar */}
            <div className="w-full bg-slate-900/60 border border-amber-500/20 rounded-full h-4 overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-300 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse"
                style={{
                  width: `${progress.chapters_total > 0 ? (progress.chapters_completed / progress.chapters_total) * 100 : 0}%`,
                }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-amber-200/50 font-bold font-kid-title">
              <span>{progress.chapters_completed} de {progress.chapters_total} Capítulos</span>
              {progress.estimated_remaining_seconds && progress.estimated_remaining_seconds > 0 && (
                <span className="text-amber-200/70">
                  ⌛ Quedan unos {formatRemainingTime(progress.estimated_remaining_seconds)}
                </span>
              )}
            </div>

            {/* Status Checklist Grids */}
            <div className="grid grid-cols-2 gap-3 pt-3 text-xs font-bold font-kid-title max-w-sm mx-auto">
              <div className={`flex items-center gap-2 justify-center p-2.5 rounded-xl border transition duration-300 ${story.text_generated ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-slate-900/40 border-amber-500/10 text-amber-300/40"}`}>
                <span>{story.text_generated ? "✅" : "⏳"}</span>
                <span>Texto del Cuento</span>
              </div>
              <div className={`flex items-center gap-2 justify-center p-2.5 rounded-xl border transition duration-300 ${story.images_generated ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-slate-900/40 border-amber-500/10 text-amber-300/40"}`}>
                <span>{story.images_generated ? "✅" : "⏳"}</span>
                <span>Dibujos de la IA</span>
              </div>
              <div className={`flex items-center gap-2 justify-center p-2.5 rounded-xl border transition duration-300 ${story.audio_generated ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-slate-900/40 border-amber-500/10 text-amber-300/40"}`}>
                <span>{story.audio_generated ? "✅" : "⏳"}</span>
                <span>Voz Narradora</span>
              </div>
              {/* <div className={`flex items-center gap-2 justify-center p-2.5 rounded-xl border transition duration-300 ${story.video_generated ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-slate-900/40 border-amber-500/10 text-amber-300/40"}`}>
                <span>{story.video_generated ? "✅" : "⏳"}</span>
                <span>Cine Animado</span>
              </div> */}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-amber-300/20 border-t-amber-300 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-orange-400/20 border-t-orange-400 animate-spin" style={{ animationDirection: "reverse" }} />
          </div>
        </div>
      </div>
    );
  }

  if (story.status === "failed") {
    return (
      <div className="max-w-2xl mx-auto rounded-3xl border border-rose-500/30 bg-slate-950/40 backdrop-blur-xl p-8 md:p-12 text-center">
        <div className="text-6xl mb-4 animate-bounce">😔</div>
        <h2 className="text-2xl md:text-3xl font-black font-kid-title text-rose-300 mb-2">¡Oh no! El hechizo ha fallado</h2>
        <p className="text-amber-100/70 font-kid-body text-sm md:text-base mb-6 max-w-md mx-auto">
          {story.error_message || "Ha ocurrido un error inesperado al intentar dar vida a tu historia."}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 font-bold text-sm shadow-lg shadow-orange-500/20 hover:scale-103 active:scale-97 transition cursor-pointer disabled:opacity-50"
          >
            {retrying ? "Reintentando..." : "🔄 Reintentar Magia"}
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 font-bold text-sm text-white hover:scale-103 active:scale-97 transition cursor-pointer"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="max-w-2xl mx-auto rounded-3xl border border-amber-500/30 bg-black/30 backdrop-blur-xl p-8 text-center">
        <p className="text-amber-100/60 font-kid-body">No hay capítulos disponibles en este libro mágico.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto rounded-3xl border border-amber-500/20 bg-slate-950/40 backdrop-blur-xl shadow-[0_0_80px_rgba(245,158,11,0.15)] p-4 md:p-8 relative" suppressHydrationWarning>
      {/* Retry banner for stories with failed chapters */}
      {hasFailedChapters && !isProcessing && (
        <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-amber-200 font-medium font-kid-body">
            ⚠️ Algunos capítulos tienen pequeños errores en sus dibujos o audio mágicos.
          </p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {retrying ? "Reintentando..." : "🔄 Reintentar Carga"}
          </button>
        </div>
      )}

      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-amber-500/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/stories"
              className="no-print inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 transition"
              onClick={playBubble}
            >
              📚 Mis Cuentos
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-black font-kid-title tracking-tight text-white">
            {story.title || "Tu cuento mágico"}
          </h1>
          <p className="text-sm font-kid-body text-amber-200/60 mt-0.5">
            Una maravillosa aventura para <span className="font-bold text-amber-200">{story.child_name}</span> ({story.child_age} años)
          </p>
        </div>

        {/* Action Toggles */}
        <div className="flex flex-wrap items-center gap-3 no-print">
          {/* Media Selector */}
          <div className="flex items-center bg-slate-900/60 rounded-full border border-amber-500/20 p-1 text-xs">
            <button
              onClick={() => handleMediaToggle("image")}
              className={`px-3 py-1.5 rounded-full font-bold font-kid-title transition ${
                mediaMode === "image"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-amber-200/60 hover:text-white"
              }`}
            >
              🖼️ Ilustración
            </button>
            {/* <button
              onClick={() => handleMediaToggle("video")}
              className={`px-3 py-1.5 rounded-full font-bold font-kid-title transition ${
                mediaMode === "video"
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-amber-200/60 hover:text-white"
              }`}
            >
              🎬 Cine IA
            </button> */}
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center bg-slate-900/60 rounded-full border border-amber-500/20 p-1 text-xs">
            <button
              onClick={() => handleViewToggle("book")}
              className={`px-3 py-1.5 rounded-full font-bold font-kid-title transition ${
                viewMode === "book"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-amber-200/60 hover:text-white"
              }`}
            >
              📖 Modo Libro
            </button>
            <button
              onClick={() => handleViewToggle("theater")}
              className={`px-3 py-1.5 rounded-full font-bold font-kid-title transition ${
                viewMode === "theater"
                  ? "bg-yellow-400 text-slate-950 shadow-md"
                  : "text-amber-200/60 hover:text-white"
              }`}
            >
              🎭 Modo Teatro
            </button>
          </div>

          {/* Print options */}
          <div className="relative" ref={printRef}>
            <button
              onClick={() => {
                playBubble();
                setPrintOpen(!printOpen);
              }}
              className="px-4 py-2 rounded-full border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-xs font-bold text-amber-200 transition cursor-pointer flex items-center gap-1"
            >
              🖨️ Imprimir ▾
            </button>
            {printOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-amber-500/20 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
                <a
                  href={`${process.env.NEXT_PUBLIC_BASE_PATH || "/app/cuentos-magicos"}/stories/print/?id=${story.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    playChime();
                    setPrintOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-amber-100 hover:bg-amber-500/20 transition"
                >
                  🖼️ Texto + Dibujos
                </a>
                <a
                  href={`${process.env.NEXT_PUBLIC_BASE_PATH || "/app/cuentos-magicos"}/stories/print/?id=${story.id}&mode=text`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    playChime();
                    setPrintOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-amber-100 hover:bg-amber-500/20 border-t border-amber-500/10 transition"
                >
                  📝 Solo texto
                </a>
              </div>
            )}
          </div>

          {/* Download options */}
          <div className="relative" ref={downloadRef}>
            <button
              onClick={() => {
                playBubble();
                setDownloadOpen(!downloadOpen);
              }}
              className="px-4 py-2 rounded-full border border-emerald-600/40 bg-emerald-900/30 hover:bg-emerald-800/40 text-xs font-bold text-emerald-200 transition cursor-pointer flex items-center gap-1"
            >
              📥 Descargar ▾
            </button>
            {downloadOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-amber-500/20 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
                <button
                  onClick={() => downloadAll("story")}
                  className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-amber-100 hover:bg-amber-500/20 transition text-left"
                >
                  📖 Texto + Audio + Imágenes
                </button>
                {/* {story.url_video && (
                  <button
                    onClick={() => downloadAll("video")}
                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-amber-100 hover:bg-amber-500/20 border-t border-amber-500/10 transition text-left"
                  >
                    🎬 Vídeo Completo del Cuento
                  </button>
                )} */}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Glowing Star Chapter Indicators */}
      <div className="flex justify-center flex-wrap gap-3 md:gap-4 my-4 py-2.5 px-6 rounded-2xl bg-amber-950/20 border border-amber-500/10 backdrop-blur-sm max-w-md mx-auto no-print">
        {localChapters.map((ch, i) => {
          const isCurrent = i === currentIndex;
          return (
            <button
              key={ch.id}
              onClick={() => {
                playWand();
                setCurrentIndex(i);
              }}
              className={`relative group text-2xl md:text-3xl transition-all duration-300 transform active:scale-90 cursor-pointer ${
                isCurrent
                  ? "text-amber-300 scale-130 filter drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]"
                  : "text-amber-300/30 hover:text-amber-300 hover:scale-110"
              }`}
              title={`Capítulo ${ch.chapter_number}`}
              aria-label={`Ir al Capítulo ${ch.chapter_number}`}
            >
              ★
              {isCurrent && (
                <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-amber-400/20 opacity-70 scale-150" />
              )}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-amber-500/30 text-white text-[10px] py-0.5 px-2 rounded-md opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap z-20 font-bold">
                Cap. {ch.chapter_number}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main content depending on viewMode */}
      <div className="no-print">
        {viewMode === "book" ? (
          /* Book Mode: Double Page Open Book view */
          <div className="magic-book-cover p-3 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Left Page: Illustration or Video */}
              <div className="rounded-3xl bg-slate-950/80 border border-slate-700/50 aspect-[4/3] flex items-center justify-center overflow-hidden relative shadow-inner group">
                {mediaMode === "image" ? (
                  (() => {
                    const imgUrl = resolveMediaUrl(current.url_image);
                    if (imgUrl) {
                      return (
                        <img
                          src={imgUrl}
                          alt={current.chapter_title}
                          className="w-full h-full object-cover rounded-2xl group-hover:scale-102 transition duration-700"
                        />
                      );
                    }
                    if (current.image_status === "processing") {
                      return (
                        <div className="text-center p-6">
                          <div className="text-4xl mb-2 animate-bounce">🎨</div>
                          <p className="text-xs font-bold font-kid-title text-amber-200/60">Los duendes mágicos están pintando la ilustración...</p>
                        </div>
                      );
                    }
                    return (
                      <div className="text-center p-6">
                        <div className="text-4xl mb-2">🖼️</div>
                        <p className="text-xs font-bold font-kid-title text-amber-200/40">Sin dibujo en esta página</p>
                      </div>
                    );
                  })()
                ) : (() => {
                  const videoUrl = resolveMediaUrl(story.url_video);
                  if (videoUrl) {
                    return (
                      <video
                        src={videoUrl}
                        controls
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    );
                  }
                  if (story.video_status === "processing" || story.video_status === "pending") {
                    return (
                      <div className="text-center p-6">
                        <div className="text-4xl mb-2 animate-pulse">🎬</div>
                        <p className="text-xs font-bold font-kid-title text-amber-200/60">Generando la película animada del cuento completo...</p>
                      </div>
                    );
                  }
                  // Fallback: show illustration with badge when no video
                  const fallbackImg = resolveMediaUrl(current.url_image);
                  if (fallbackImg) {
                    return (
                      <div className="relative w-full h-full">
                        <img
                          src={fallbackImg}
                          alt={current.chapter_title}
                          className="w-full h-full object-cover rounded-2xl opacity-70"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-black/70 backdrop-blur-sm text-white text-xs font-bold font-kid-title px-4 py-2 rounded-full border border-white/20">
                            🎬 Vídeo no disponible para este capítulo
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="text-center p-6">
                      <div className="text-4xl mb-2">📺</div>
                      <p className="text-xs font-bold font-kid-title text-amber-200/40">Sin contenido multimedia</p>
                    </div>
                  );
                })()}
              </div>

              {/* Right Page: Pergamino Scroll */}
              <div className="pergamino-sheet flex flex-col p-5 md:p-8 rounded-3xl min-h-[350px] max-h-[520px] md:max-h-[600px] shadow-2xl relative overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-4 border-b border-amber-900/10 pb-2 shrink-0">
                    <h2 className="text-lg md:text-xl font-black font-kid-title text-amber-950">
                      Cap. {current.chapter_number}: {current.chapter_title}
                    </h2>
                    <span className="text-xs font-bold font-kid-title text-amber-900/60 bg-amber-900/5 px-2.5 py-1 rounded-full whitespace-nowrap ml-2">
                      Pág. {currentIndex + 1} de {localChapters.length}
                    </span>
                  </div>

                  {/* Text scroll area — flex-1 fills remaining space */}
                  <div className="font-kid-body text-base md:text-lg lg:text-xl font-semibold leading-relaxed flex-1 overflow-y-auto pr-2 text-amber-950 whitespace-pre-line break-words scrollbar-thin scrollbar-thumb-amber-700/20">
                    {current.chapter_text}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-amber-900/10 flex flex-col gap-4">
                  {/* Audio Controls */}
                  {(() => {
                    const audioUrl = resolveMediaUrl(current.url_audio);
                    if (audioUrl) {
                      return (
                        <div className="flex items-center gap-3 bg-amber-900/15 border border-amber-955/10 rounded-2xl p-2.5">
                          <button
                            onClick={toggleAudio}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                              isPlaying
                                ? "bg-amber-600 text-white scale-105 shadow-[0_0_12px_rgba(245,158,11,0.4)] border border-amber-400 cursor-pointer"
                                : "bg-amber-100 border border-amber-200 hover:bg-amber-200 text-amber-900 cursor-pointer"
                            }`}
                            aria-label={isPlaying ? "Pausar" : "Escuchar narrador"}
                          >
                            {isPlaying ? "⏸" : "▶"}
                          </button>
                          <audio
                            ref={audioRef}
                            src={audioUrl}
                            onEnded={() => setIsPlaying(false)}
                            className="hidden"
                          />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-amber-950/50 uppercase tracking-widest font-kid-title">
                              {isPlaying ? "REPRODUCIENDO" : "ESCUCHAR CUENTO"}
                            </span>
                            <span className="text-xs md:text-sm font-semibold text-amber-900/80 font-kid-body">
                              {isPlaying ? "La voz mágica te lee el cuento..." : "Toca para oír al narrador narrar"}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    if (current.audio_status === "processing") {
                      return (
                        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-amber-900/5 text-amber-900/60 font-kid-title text-xs font-bold">
                          <span>🎙️</span>
                          <span>Los duendes están grabando el audiolibro...</span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Navigation */}
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={goPrev}
                      disabled={currentIndex === 0}
                      className="px-4 md:px-5 py-2.5 rounded-2xl border border-amber-900/30 text-amber-950 font-bold text-xs md:text-sm bg-amber-900/5 disabled:opacity-30 hover:bg-amber-900/10 transition cursor-pointer whitespace-nowrap"
                    >
                      ← <span className="hidden md:inline">Página </span>Anterior
                    </button>
                    <button
                      onClick={goNext}
                      disabled={currentIndex === localChapters.length - 1}
                      className="px-4 md:px-5 py-2.5 rounded-2xl border border-amber-900/30 text-amber-950 font-bold text-xs md:text-sm bg-amber-900/5 disabled:opacity-30 hover:bg-amber-900/10 transition cursor-pointer whitespace-nowrap"
                    >
                      <span className="hidden md:inline">Página </span>Siguiente →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Theater Mode: Giant visual with subtitles and ambient border */
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            {/* Screen wrapped in cinema frame */}
            <div className="theater-frame bg-black overflow-hidden aspect-[16/9] w-full flex items-center justify-center relative shadow-[0_0_50px_rgba(251,191,36,0.25)]">
              {mediaMode === "image" ? (
                (() => {
                  const imgUrl = resolveMediaUrl(current.url_image);
                  if (imgUrl) {
                    return (
                      <img
                        src={imgUrl}
                        alt={current.chapter_title}
                        className="w-full h-full object-contain"
                      />
                    );
                  }
                  if (current.image_status === "processing") {
                    return (
                      <div className="text-center p-6">
                        <div className="text-4xl mb-2 animate-bounce">🎨</div>
                        <p className="text-xs font-bold font-kid-title text-slate-400">Generando ilustración de alta definición...</p>
                      </div>
                    );
                  }
                  return (
                    <div className="text-center p-6">
                      <div className="text-4xl mb-2 text-slate-600">🖼️</div>
                      <p className="text-xs font-bold font-kid-title text-slate-400">Sin dibujo en la sala</p>
                    </div>
                  );
                })()
              ) : (() => {
                const videoUrl = resolveMediaUrl(story.url_video);
                if (videoUrl) {
                  return (
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  );
                }
                if (story.video_status === "processing" || story.video_status === "pending") {
                  return (
                    <div className="text-center p-6">
                      <div className="text-4xl mb-2 animate-pulse">🎬</div>
                      <p className="text-xs font-bold font-kid-title text-slate-400">Produciendo película completa de animación...</p>
                    </div>
                  );
                }
                const fallbackImg = resolveMediaUrl(current.url_image);
                if (fallbackImg) {
                  return (
                    <div className="relative w-full h-full">
                      <img
                        src={fallbackImg}
                        alt={current.chapter_title}
                        className="w-full h-full object-contain opacity-60"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-black/70 backdrop-blur-sm text-white text-xs font-bold font-kid-title px-4 py-2 rounded-full border border-white/20">
                          🎬 Vídeo no disponible para este capítulo
                        </span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="text-center p-6">
                    <div className="text-4xl mb-2 text-slate-600">📺</div>
                    <p className="text-xs font-bold font-kid-title text-slate-400">Sin contenido multimedia</p>
                  </div>
                );
              })()}
            </div>

            {/* Movie Caption Box / Subtitles */}
            <div className="bg-slate-950/80 border border-amber-500/20 rounded-3xl p-4 md:p-8 text-center shadow-2xl relative">
              <div className="text-xs text-amber-300 font-bold uppercase tracking-widest mb-2 font-kid-title">
                Capítulo {current.chapter_number}: {current.chapter_title}
              </div>
              <div className="max-h-[150px] md:max-h-[220px] overflow-y-auto pr-1 mb-4 scrollbar-thin scrollbar-thumb-amber-500/20">
                <p className="font-kid-body text-base md:text-lg lg:text-xl text-amber-100 font-semibold leading-relaxed max-w-3xl mx-auto whitespace-pre-line break-words">
                  {current.chapter_text}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-amber-500/10 pt-4">
                {/* Audio Narrator */}
                {(() => {
                  const audioUrl = resolveMediaUrl(current.url_audio);
                  if (audioUrl) {
                    return (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={toggleAudio}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isPlaying
                              ? "bg-amber-500 text-white scale-105"
                              : "bg-white/10 border border-white/20 hover:bg-white/20 text-white"
                          }`}
                          aria-label={isPlaying ? "Pausar" : "Escuchar narrador"}
                        >
                          {isPlaying ? "⏸" : "▶"}
                        </button>
                        <audio
                          ref={audioRef}
                          src={audioUrl}
                          onEnded={() => setIsPlaying(false)}
                          className="hidden"
                        />
                        <span className="text-xs font-bold font-kid-title text-amber-300/70">
                          {isPlaying ? "Escuchando narrador..." : "Reproducir voz de cine"}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Film controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 rounded-xl border border-slate-700 bg-white/5 text-xs font-bold disabled:opacity-30 hover:bg-white/10 transition cursor-pointer"
                  >
                    ◀ Anterior
                  </button>
                  <span className="text-xs font-bold font-kid-title text-slate-400">
                    {currentIndex + 1} / {localChapters.length}
                  </span>
                  <button
                    onClick={goNext}
                    disabled={currentIndex === localChapters.length - 1}
                    className="px-4 py-2 rounded-xl border border-slate-700 bg-white/5 text-xs font-bold disabled:opacity-30 hover:bg-white/10 transition cursor-pointer"
                  >
                    Siguiente ▶
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print version: all chapters stacked */}
      <div className="print-only hidden">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {story.title || "Tu cuento mágico"}
          </h1>
          <p className="text-gray-600">
            Para {story.child_name}, {story.child_age} años
          </p>
        </div>

        {localChapters.map((ch) => (
          <div
            key={ch.id}
            className="mb-8 pb-8 border-b border-gray-300 last:border-b-0"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              Capítulo {ch.chapter_number}: {ch.chapter_title}
            </h2>

            {(() => {
              const imgUrl = resolveMediaUrl(ch.url_image);
              return imgUrl ? (
                <div className="mb-4">
                  <img
                    src={imgUrl}
                    alt={ch.chapter_title}
                    className="max-w-full h-auto rounded-lg mx-auto"
                    style={{ maxHeight: "400px" }}
                  />
                </div>
              ) : null;
            })()}

            <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
              {ch.chapter_text}
            </p>
          </div>
        ))}

        <div className="text-center text-sm text-gray-400 mt-8">
          <p>Generado con CuentosMagicos AI</p>
        </div>
      </div>
    </div>
  );
}

