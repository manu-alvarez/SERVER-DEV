"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { playBubble, playChime } from "@/lib/sound";

interface StoryItem {
  id: string;
  title: string;
  child_name: string;
  status: string;
  chapter_count: number;
  created_at: string;
}

interface StoriesListClientProps {
  initialStories?: StoryItem[];
  totalCount?: number;
}

function getBookAesthetics(title: string) {
  const t = title.toLowerCase();
  
  let emoji = "📖";
  let gradient = "from-amber-600 via-amber-500 to-amber-700";
  let borderGold = "border-yellow-400/30";
  let textBadge = "text-amber-200 bg-amber-950/40";
  
  if (t.includes("espacio") || t.includes("estrella") || t.includes("astronauta") || t.includes("cohete") || t.includes("galaxia") || t.includes("luna") || t.includes("marte") || t.includes("universo")) {
    emoji = "🚀";
    gradient = "from-amber-950 via-orange-900 to-yellow-950";
    borderGold = "border-cyan-300/30";
    textBadge = "text-cyan-200 bg-cyan-950/40";
  } else if (t.includes("unicornio") || t.includes("fantasia") || t.includes("magia") || t.includes("hechizo") || t.includes("varita") || t.includes("arcoiris") || t.includes("arco iris")) {
    emoji = "🦄";
    gradient = "from-orange-500 via-amber-500 to-yellow-500";
    borderGold = "border-orange-300/40";
    textBadge = "text-orange-200 bg-orange-950/40";
  } else if (t.includes("dinosaurio") || t.includes("dino") || t.includes("t-rex") || t.includes("triceratops") || t.includes("jurásico")) {
    emoji = "🦖";
    gradient = "from-emerald-700 via-green-600 to-emerald-800";
    borderGold = "border-yellow-400/20";
    textBadge = "text-emerald-200 bg-emerald-950/40";
  } else if (t.includes("hada") || t.includes("bosque") || t.includes("duende") || t.includes("arbol") || t.includes("naturaleza") || t.includes("flores")) {
    emoji = "🧚‍♀️";
    gradient = "from-teal-600 via-emerald-500 to-green-700";
    borderGold = "border-emerald-300/30";
    textBadge = "text-emerald-200 bg-emerald-950/40";
  } else if (t.includes("alien") || t.includes("extraterrestre") || t.includes("platillo") || t.includes("ovni") || t.includes("galáctico")) {
    emoji = "👽";
    gradient = "from-lime-600 via-emerald-600 to-cyan-800";
    borderGold = "border-lime-300/30";
    textBadge = "text-lime-200 bg-lime-950/40";
  } else if (t.includes("superhéroe") || t.includes("superheroe") || t.includes("poder") || t.includes("capa") || t.includes("misión") || t.includes("valiente")) {
    emoji = "🦸‍♂️";
    gradient = "from-red-700 via-orange-600 to-yellow-700";
    borderGold = "border-yellow-300/40";
    textBadge = "text-rose-200 bg-rose-950/40";
  } else if (t.includes("pez") || t.includes("mar") || t.includes("oceano") || t.includes("delfin") || t.includes("tiburón") || t.includes("agua") || t.includes("colores") || t.includes("coral")) {
    emoji = "🐠";
    gradient = "from-cyan-600 via-blue-500 to-sky-700";
    borderGold = "border-sky-300/30";
    textBadge = "text-sky-200 bg-sky-950/40";
  } else if (t.includes("princesa") || t.includes("caballero") || t.includes("castillo") || t.includes("rey") || t.includes("reina") || t.includes("dragón") || t.includes("dragon")) {
    emoji = "👸";
    gradient = "from-amber-700 via-rose-600 to-amber-900";
    borderGold = "border-amber-400/40";
    textBadge = "text-amber-200 bg-amber-950/40";
  } else {
    const colors = [
      "from-amber-700 via-orange-600 to-yellow-800",
      "from-amber-600 via-orange-500 to-amber-800",
      "from-orange-700 via-amber-600 to-yellow-700",
      "from-yellow-700 via-orange-600 to-amber-800",
      "from-orange-800 via-red-700 to-amber-800",
      "from-emerald-700 via-teal-600 to-green-800"
    ];
    const index = Math.abs(title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
    gradient = colors[index];
    
    const emojis = ["📖", "🌟", "📚", "🎨", "🌈", "🧸"];
    emoji = emojis[index % emojis.length];
    borderGold = "border-yellow-400/30";
    textBadge = "text-amber-200 bg-amber-950/40";
  }
  
  return { emoji, gradient, borderGold, textBadge };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    ready: "Listo 📖",
    text_ready: "Texto listo ✍️",
    processing: "Mágia en curso... 🪄",
    text_pending: "En cola ⏳",
    pending: "En cola ⏳",
    failed: "Hechizo fallido ⚠️",
  };
  return labels[status] || status;
}

function getStatusBadgeClass(status: string) {
  const styles: Record<string, string> = {
    ready: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    text_ready: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    processing: "bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse",
    text_pending: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    pending: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    failed: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  };
  return styles[status] || "bg-slate-500/20 text-slate-300 border-slate-500/40";
}

export default function StoriesListClient({ initialStories = [], totalCount = 0 }: StoriesListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stories, setStories] = useState<StoryItem[]>(initialStories);
  const [total, setTotal] = useState<number>(totalCount);
  const [isLoading, setIsLoading] = useState<boolean>(initialStories.length === 0);

  // Fetch stories on mount to ensure we always have the latest data
  useEffect(() => {
    const fetchStories = async () => {
      setIsLoading(true);
      try {
        // In the browser, this proxy path works perfectly.
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:8007` : "http://localhost:8007");
        const res = await fetch(`${apiBase}/api/stories/?page=1&page_size=50`);
        if (res.ok) {
          const data = await res.json();
          setStories(data.stories || []);
          setTotal(data.total || 0);
        }
      } catch (err) {
        console.error("Failed to fetch stories client-side:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStories();
  }, []);

  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.child_name.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "ready") return matchesSearch && story.status === "ready";
    if (statusFilter === "processing") return matchesSearch && ["processing", "text_pending", "pending", "text_ready"].includes(story.status);
    if (statusFilter === "failed") return matchesSearch && story.status === "failed";
    
    return matchesSearch;
  });

  const readyCount = stories.filter((s) => s.status === "ready").length;
  const processingCount = stories.filter((s) => ["processing", "text_pending", "pending", "text_ready"].includes(s.status)).length;
  const failedCount = stories.filter((s) => s.status === "failed").length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-amber-200 font-bold font-kid-title animate-pulse">Abriendo la estantería mágica...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-kid-body">
      {/* Search & Filter Dashboard */}
      <div className="bg-amber-900/10 border border-amber-500/20 rounded-3xl p-5 md:p-6 backdrop-blur-md space-y-4 max-w-4xl mx-auto shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search Box */}
          <div className="relative w-full md:flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Buscar por título o el nombre del héroe..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-amber-950/60 border-2 border-amber-500/30 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/15 text-white placeholder-amber-300/40 text-sm font-bold transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center">
            <button
              onClick={() => { playBubble(); setStatusFilter("all"); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition cursor-pointer select-none ${
                statusFilter === "all"
                  ? "bg-amber-500 border-amber-400 text-white shadow-md shadow-amber-500/20"
                  : "bg-white/5 border-white/10 text-amber-200 hover:bg-white/10"
              }`}
            >
              📚 Todos ({stories.length})
            </button>
            <button
              onClick={() => { playBubble(); setStatusFilter("ready"); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition cursor-pointer select-none ${
                statusFilter === "ready"
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/20"
                  : "bg-white/5 border-white/10 text-emerald-200 hover:bg-white/10"
              }`}
            >
              📖 Listos ({readyCount})
            </button>
            <button
              onClick={() => { playBubble(); setStatusFilter("processing"); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition cursor-pointer select-none ${
                statusFilter === "processing"
                  ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20"
                  : "bg-white/5 border-white/10 text-blue-200 hover:bg-white/10"
              }`}
            >
              🪄 Creándose ({processingCount})
            </button>
            <button
              onClick={() => { playBubble(); setStatusFilter("failed"); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition cursor-pointer select-none ${
                statusFilter === "failed"
                  ? "bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-600/20"
                  : "bg-white/5 border-white/10 text-rose-200 hover:bg-white/10"
              }`}
            >
              ⚠️ Fallidos ({failedCount})
            </button>
          </div>
        </div>
      </div>

      {/* No stories found */}
      {filteredStories.length === 0 ? (
        <div className="text-center py-20 bg-amber-900/5 rounded-3xl border border-amber-500/10 max-w-lg mx-auto">
          <div className="text-6xl mb-4 animate-bounce">🧙‍♂️💨</div>
          <h2 className="text-xl font-black font-kid-title text-amber-200 mb-2">
            No se encontraron cuentos
          </h2>
          <p className="text-amber-200/60 text-sm max-w-xs mx-auto mb-6">
            Intenta cambiar los filtros o busca un nombre diferente. ¡O crea un nuevo cuento mágico!
          </p>
          <Link
            href="/create"
            onClick={playChime}
            className="inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-black shadow-lg hover:brightness-110 active:scale-95 transition"
          >
            + Crear Cuento
          </Link>
        </div>
      ) : (
        /* Magical Bookshelf Layout */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12 max-w-6xl mx-auto pt-6 px-2">
          {filteredStories.map((story) => {
            const { emoji, gradient, borderGold, textBadge } = getBookAesthetics(story.title);
            return (
              <div
                key={story.id}
                className="relative pb-10 flex flex-col items-center justify-end h-72 md:h-80 group"
              >
                {/* Book Link */}
                <Link
                  href={`/stories/detail?id=${story.id}`}
                  onClick={playChime}
                  onMouseEnter={playBubble}
                  className={`w-32 sm:w-36 md:w-44 h-52 sm:h-56 md:h-64 rounded-2xl bg-gradient-to-b ${gradient} shadow-md group-hover:shadow-[0_20px_35px_rgba(0,0,0,0.6)] border-2 border-white/10 group-hover:border-white/30 transition-all duration-300 transform group-hover:-translate-y-6 group-hover:rotate-3 group-hover:scale-105 flex flex-col justify-between p-3 select-none relative overflow-hidden active:scale-98`}
                >
                  {/* Spine Overlay */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-black/10 to-transparent rounded-l-xl z-20 border-r border-white/5" />
                  
                  {/* Leather spine ridges decoration */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 flex flex-col justify-around py-4 z-20 pointer-events-none opacity-30">
                    <div className="h-[1.5px] w-full bg-yellow-300" />
                    <div className="h-[1.5px] w-full bg-yellow-300" />
                    <div className="h-[1.5px] w-full bg-yellow-300" />
                    <div className="h-[1.5px] w-full bg-yellow-300" />
                  </div>

                  {/* Gold foil decorative inner border */}
                  <div className={`absolute inset-2 border-2 ${borderGold} rounded-xl pointer-events-none z-10`} />

                  {/* Header/Badge inside book cover */}
                  <div className="flex flex-col items-center pt-2 z-10 w-full">
                    <span className={`text-[9px] font-black font-kid-title px-2 py-0.5 rounded-full uppercase tracking-wider ${textBadge}`}>
                      {story.child_name}
                    </span>
                  </div>

                  {/* Hero Emoji inside cover */}
                  <div className="flex justify-center items-center my-1 z-10">
                    <span className="text-4xl filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.4)] animate-bounce-gentle group-hover:scale-110 transition duration-300">
                      {emoji}
                    </span>
                  </div>

                  {/* Story Title inside cover */}
                  <div className="text-center z-10 px-1 mb-2">
                    <h3 className="font-kid-title font-black text-xs md:text-sm text-yellow-50 leading-snug line-clamp-3 filter drop-shadow-md">
                      {story.title || "Tu cuento"}
                    </h3>
                  </div>

                  {/* Bottom spine decoration */}
                  <div className="text-center z-10 pt-1 border-t border-white/10 flex justify-between items-center text-[9px] text-white/50 font-bold">
                    <span>{story.chapter_count} cap.</span>
                    <span>{formatDate(story.created_at)}</span>
                  </div>

                  {/* Status Capsule Ribbon on the cover */}
                  <span className={`absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full border z-20 shadow-md ${getStatusBadgeClass(story.status)}`}>
                    {getStatusLabel(story.status)}
                  </span>
                </Link>

                {/* Wooden Shelf Segment. Bridges gap with -left-3 and -right-3 */}
                <div className="absolute bottom-0 -left-3 -right-3 h-5 bookshelf-row z-20 pointer-events-none" />
              </div>
            );
          })}
        </div>
      )}

      {/* Footer stats badge */}
      {filteredStories.length > 0 && (
        <footer className="text-center py-8 text-xs font-bold text-amber-300/40 mt-8">
          <p>
            Mostrando {filteredStories.length} de {total} cuentos en la estantería mágica
          </p>
        </footer>
      )}
    </div>
  );
}
