"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { playBubble, playSpell, playChime } from "@/lib/sound";

type ContentKey = "text" | "images" | "audio" | "video";

const FEATURES: { key: ContentKey; icon: string; label: string; desc: string; color: string }[] = [
  { key: "text", icon: "📖", label: "Texto Mágico", desc: "La historia capitulada", color: "from-amber-500 to-orange-600" },
  { key: "images", icon: "🎨", label: "Ilustraciones", desc: "Dibujos hechos con IA", color: "from-yellow-400 to-amber-500" },
  { key: "audio", icon: "🎙️", label: "Voz de Hada", desc: "Narración de cuento", color: "from-cyan-400 to-blue-500" },
  // { key: "video", icon: "🎬", label: "Cine Animado", desc: "Las imágenes cobran vida", color: "from-emerald-400 to-teal-500" },
];

export default function HomePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<ContentKey, boolean>>({
    text: true,
    images: true,
    audio: false,
    video: false,
  });

  const toggle = (key: ContentKey) => {
    if (key === "text") return;
    playBubble();
    setSelected((prev) => {
      const nextVal = !prev[key];
      // If video is enabled, images must be enabled too (video needs image to animate)
      const nextState = { ...prev, [key]: nextVal };
      if (key === "video" && nextVal) {
        nextState.images = true;
      }
      return nextState;
    });
  };

  const buildContentType = () => {
    const parts = ["text"];
    if (selected.images) parts.push("image");
    if (selected.audio) parts.push("audio");
    if (selected.video) parts.push("video");
    return parts.join("_");
  };

  const handleCreate = async () => {
    await playSpell();
    setTimeout(() => {
      router.push(`/create?type=${buildContentType()}`);
    }, 300);
  };

  const handleLibraryClick = () => {
    playChime();
  };

  return (
    <main className="min-h-screen text-white relative overflow-hidden font-kid-body">
      {/* Decorative large light orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[90vh] px-4 pt-16 text-center relative z-10">
        {/* Adorable spinning sparkle helper */}
        <div className="mb-4 text-7xl bounce-gentle drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] cursor-pointer select-none" onClick={playChime}>
          ✨🧸✨
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4 font-kid-title drop-shadow-md">
          Cuentos<span className="shimmer-text">Magicos</span> AI
        </h1>
        
        <p className="text-lg md:text-2xl text-amber-100/90 max-w-3xl mb-12 font-medium leading-relaxed">
          ¡Crea cuentos fantásticos personalizados donde <span className="text-orange-300">tu hijo/a es el protagonista principal</span>!
          Genera texto, bellos dibujos, voces y películas animadas con pura magia.
        </p>

        {/* Content type selector */}
        <div className="portal-card w-full max-w-4xl mb-12" style={{ borderRadius: '2.5rem', padding: 0 }}>
          <div className="portal-card-inner p-6 md:p-8" style={{ borderRadius: '2.3rem' }}>
          <p className="text-base md:text-lg text-amber-200 font-bold mb-6 flex items-center justify-center gap-2">
            ⭐ ¿Qué ingredientes llevará tu cuento mágico? ⭐
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {FEATURES.map((f) => {
              const isOn = selected[f.key];
              return (
                <button
                  key={f.key}
                  onClick={() => toggle(f.key)}
                  className={`group relative rounded-[2rem] border-3 p-4 md:p-5 backdrop-blur-sm transition duration-300 text-center cursor-pointer select-none flex flex-col items-center justify-between min-h-[10rem] h-full ${
                    isOn
                      ? "bg-amber-500/20 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)] scale-[1.03] magic-glow"
                      : "bg-white/5 border-white/10 opacity-60 hover:opacity-100 hover:border-white/20"
                  }`}
                >
                  {/* Miniature colored background blob */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-5 rounded-[2rem] transition-opacity`} />
                  
                  <div>
                    <div className="text-4xl mb-2 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] transform group-hover:scale-110 transition-transform">{f.icon}</div>
                    <div className="font-extrabold text-sm md:text-base font-kid-title text-white">{f.label}</div>
                    <div className="text-xs text-amber-200/80 leading-tight mt-1">{f.desc}</div>
                  </div>

                  <div className="mt-3">
                    {f.key !== "text" ? (
                      <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        isOn 
                          ? "bg-amber-400/20 border-amber-300 text-amber-200" 
                          : "bg-white/5 border-white/10 text-white/50"
                      }`}>
                        {isOn ? "✨ Activo" : "✕ Inactivo"}
                      </span>
                    ) : (
                      <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-300 text-amber-200">
                        ✨ Siempre activo
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          </div>
        </div>

        {/* Big magical Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-20">
          <button
            onClick={handleCreate}
            className="magic-glow-gold px-10 py-5 rounded-[2rem] bg-gradient-to-r from-yellow-400 via-orange-500 to-amber-600 font-black text-xl shadow-[0_15px_40px_rgba(251,191,36,0.6)] hover:brightness-110 hover:scale-[1.04] transition duration-300 active:scale-95 cursor-pointer flex items-center gap-2.5"
          >
            <span>🪄</span>
            <span>¡Crear Cuento Mágico!</span>
            <span>✨</span>
          </button>
          
          <Link
            href="/stories"
            onClick={handleLibraryClick}
            className="theme-card px-8 py-5 rounded-[2rem] border-3 border-amber-400/30 bg-amber-950/40 font-extrabold text-lg flex items-center gap-2 hover:bg-amber-950/80 transition duration-300"
          >
            <span>📚</span>
            <span>Ver Mis Cuentos</span>
          </Link>
        </div>

        <p className="mt-6 text-sm text-amber-200/60 font-semibold italic">
          {selected.video
            ? "🪄 Hechizo actual: Generarás Texto + Bellos Dibujos + Voz + Película Animada"
            : selected.audio && selected.images
            ? "🪄 Hechizo actual: Generarás Texto + Bellos Dibujos + Voz Narrada"
            : selected.audio
            ? "🪄 Hechizo actual: Generarás Texto + Voz Narrada"
            : selected.images
            ? "🪄 Hechizo actual: Generarás Texto + Bellos Dibujos"
            : "🪄 Hechizo actual: Generarás solo Texto para leer"}
        </p>
      </section>

      {/* Redesigned lúdico "Adventure Map" / How it works */}
      <section className="px-4 py-20 max-w-5xl mx-auto relative z-10">
        <h2 className="text-3xl md:text-5xl font-black text-center mb-16 font-kid-title shimmer-text text-shadow-md">
          🗺️ ¡El Mapa de tu Aventura! 🗺️
        </h2>
        
        {/* Connective dots background decorator for large screens */}
        <div className="absolute top-[40%] left-[10%] right-[10%] h-1 border-t-4 border-dashed border-amber-500/20 z-0 hidden md:block" />

        <div className="grid md:grid-cols-3 gap-8 relative z-10">
          {[
            {
              step: "1",
              icon: "🎨",
              title: "1. Elige los ingredientes",
              desc: "Escribe el nombre de tu niño/a, elige a su héroe favorito (¡como un explorador o unicornio!), la temática y la gran lección que aprenderá hoy.",
              color: "border-amber-400 shadow-amber-500/10",
              iconBg: "bg-amber-500/20 text-amber-300"
            },
            {
              step: "2",
              icon: "🧙‍♂️",
              title: "2. La IA crea la magia",
              desc: "Nuestros elfos digitales se ponen a trabajar: escriben la historia, pintan preciosas ilustraciones consistentes, graban la narración y animan los dibujos.",
              color: "border-orange-400 shadow-orange-500/10",
              iconBg: "bg-orange-500/20 text-orange-300"
            },
            {
              step: "3",
              icon: "🦄",
              title: "3. ¡A leer y disfrutar!",
              desc: "¡Tu cuento está listo! Ábrelo en Modo Libro de pergamino para leerlo juntos, o actívalo en Modo Teatro para ver la película animada mientras escuchan la voz de hada.",
              color: "border-yellow-400 shadow-yellow-500/10",
              iconBg: "bg-yellow-500/20 text-yellow-300"
            },
          ].map((s, i) => (
            <div
              key={s.step}
              className={`portal-card rounded-[2.5rem] p-0 shadow-2xl flex flex-col justify-between hover:scale-[1.04] transition duration-300`}
            >
              <div className="portal-card-inner p-8 flex flex-col justify-between" style={{ borderRadius: '2.3rem' }}>
              <div>
                <div className={`w-16 h-16 ${s.iconBg} rounded-2xl flex items-center justify-center text-4xl mb-6 bounce-gentle shadow-md`}>
                  {s.icon}
                </div>
                <h3 className="font-black text-xl md:text-2xl mb-4 font-kid-title text-white">{s.title}</h3>
                <p className="text-sm md:text-base text-amber-100/80 leading-relaxed font-medium">{s.desc}</p>
              </div>
              
              <div className="mt-6 text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                <span>🚀 Paso</span>
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center font-bold">{s.step}</span>
              </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-12 text-sm text-amber-200/50 relative z-10 border-t border-amber-500/10 bg-black/20">
        <p className="font-bold flex items-center justify-center gap-1.5">
          <span>✨</span>
          <span>CuentosMagicos AI &mdash; Creado con amor y magia para todos los niños del universo</span>
          <span>✨</span>
        </p>
        <p className="text-xs text-amber-200/30 mt-2">Versión 2.0 ✨ PWA Totalmente Offline</p>
      </footer>
    </main>
  );
}
