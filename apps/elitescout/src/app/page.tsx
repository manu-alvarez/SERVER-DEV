"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { TravelSearchForm } from "@/components/search/TravelSearchForm";

const CATEGORIES = [
  { label: "Viajes", icon: "🌍", query: "ofertas viaje pack completo", color: "gold", description: "Vuelos + Hotel + Transporte" },
  { label: "Tecnología", icon: "🚀", query: "gadgets ultima hora", color: "cyan", description: "Lanzamientos y ofertas" },
  { label: "Moda", icon: "💎", query: "luxury fashion deals", color: "gold", description: "Firmas exclusivas" },
  { label: "Hogar", icon: "🏰", query: "smart home elite", color: "cyan", description: "Diseño y domótica" },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"product" | "travel">("product");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("elitescout_recent");
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const handleSearch = (customQuery?: string) => {
    const finalQuery = customQuery || query;
    if (!finalQuery.trim()) return;
    
    const updated = [finalQuery, ...recentSearches.filter((s) => s !== finalQuery)].slice(0, 5);
    localStorage.setItem("elitescout_recent", JSON.stringify(updated));
    router.push(`/results?q=${encodeURIComponent(finalQuery.trim())}${searchMode === "travel" ? "&type=travel" : ""}`);
  };

  const handleTravelSearch = (data: any) => {
    const travelQuery = `Viaje de ${data.origin} a ${data.destination} en ${data.mode}`;
    const params = new URLSearchParams({
      q: travelQuery,
      type: "travel",
      origin: data.origin,
      dest: data.destination,
      mode: data.mode,
      depart: data.departDate,
      return: data.returnDate || "",
      adults: String(data.adults),
      children: String(data.children),
      infants: String(data.infants),
      tripType: data.tripType,
    });
    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="flex flex-col items-center min-h-screen px-6 py-12 mesh-bg relative">
      {/* Dynamic Luxury Accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gold/5 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan/5 blur-[120px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header / Logo Section */}
      <motion.div
        className="text-center mt-12 mb-16 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-gold/10 text-[10px] text-gold font-bold mb-6 tracking-[0.2em] uppercase">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
          </span>
          Next-Gen Elite Intelligence
        </div>

        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6">
          <span className="text-white">Elite</span>
          <span className="gold-gradient-text ml-2">Scout</span>
        </h1>
        
        <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
          Encuentra ofertas exclusivas, packs de viajes completos y tecnología de vanguardia con análisis profundo de IA.
        </p>
      </motion.div>

      {/* Mode Selector */}
      <div className="flex p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl mb-8 z-10">
        <button
          onClick={() => setSearchMode("product")}
          className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            searchMode === "product" ? "bg-white/10 text-white shadow-xl" : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Productos
        </button>
        <button
          onClick={() => setSearchMode("travel")}
          className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            searchMode === "travel" ? "bg-gold/20 text-gold shadow-xl" : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Viajes & Packs
        </button>
      </div>

      {/* Search Section */}
      <div className="w-full max-w-4xl z-10 mb-12 min-h-[140px]">
        <AnimatePresence mode="wait">
          {searchMode === "product" ? (
            <motion.div
              key="product-search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full"
            >
              <SearchBar
                value={query}
                onChange={setQuery}
                onSearch={() => handleSearch()}
                size="hero"
                placeholder="Busca el producto de tus sueños o una oferta de lujo..."
              />
            </motion.div>
          ) : (
            <motion.div
              key="travel-search"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <TravelSearchForm onSearch={handleTravelSearch} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ FAMILY MODE — Dedicated Premium Banner ═══ */}
      <motion.div
        className="w-full max-w-6xl z-10 mb-14"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={() => router.push('/family-travel')}
          className="group w-full relative overflow-hidden rounded-3xl border border-white/[0.08] transition-all duration-500 hover:border-[#FF6B6B]/30 hover:shadow-[0_0_40px_rgba(255,107,107,0.1)]"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B6B]/10 via-[#4ECDC4]/8 to-[#FFE66D]/10 opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(255,107,107,0.08),transparent_60%)]" />
          
          <div className="relative flex items-center gap-6 p-6 md:p-8">
            {/* Icon block */}
            <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#FF6B6B]/20 to-[#4ECDC4]/20 border border-white/10 flex items-center justify-center text-4xl md:text-5xl group-hover:scale-110 transition-transform duration-500">
              ✈️
            </div>

            {/* Content */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-[#FF6B6B] transition-colors">
                  Family Mode
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-[#FF6B6B]/15 text-[#FF6B6B] border border-[#FF6B6B]/20">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B6B] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF6B6B]"></span>
                  </span>
                  Personal
                </span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed max-w-xl">
                Buscador de viajes familiares con IA — Destinos ideales desde Mequinenza para 2 adultos + 1 niña. 
                Comparador coche / avión / tren, mapa interactivo y chat IA personalizado.
              </p>
            </div>

            {/* CTA arrow */}
            <div className="hidden md:flex flex-shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#FF6B6B] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
              Abrir
              <span className="text-xl">→</span>
            </div>
          </div>
        </button>
      </motion.div>

      {/* Categories / Quick Deals */}
      <div className="w-full max-w-6xl z-10">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Explorar Ofertas Elite</h2>
          <div className="h-px flex-1 mx-6 bg-gradient-to-r from-white/10 to-transparent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat, idx) => (
            <motion.button
              key={cat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx + 0.5 }}
              onClick={() => handleSearch(cat.query)}
              className="group portal-card relative flex flex-col items-start rounded-3xl text-left transition-all duration-500 overflow-hidden h-48"
              style={{ padding: 0 }}
            >
              <div className="portal-card-inner flex flex-col items-start p-6 h-full w-full relative" style={{ borderRadius: '1.4rem' }}>
              <div className={`absolute -right-4 -bottom-4 text-7xl opacity-10 grayscale group-hover:grayscale-0 group-hover:opacity-20 transition-all duration-500 group-hover:scale-125`}>
                {cat.icon}
              </div>
              
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 ${
                cat.color === "gold" ? "bg-gold/10 text-gold" : "bg-cyan/10 text-cyan"
              }`}>
                {cat.icon}
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-gold transition-colors">{cat.label}</h3>
              <p className="text-xs text-text-muted leading-relaxed max-w-[80%]">{cat.description}</p>
              
              <div className="mt-auto flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                Ver Ofertas <span className="text-base">→</span>
              </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-auto py-12 text-center z-10">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.4em]">
          EliteScout Intelligence v2.0 • Technological Luxury Search
        </p>
      </div>
    </div>
  );
}

