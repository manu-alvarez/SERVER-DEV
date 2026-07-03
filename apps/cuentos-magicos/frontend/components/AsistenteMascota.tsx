"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { playBubble } from "@/lib/sound";

interface MascotProps {
  customMessage?: string;
}

export default function AsistenteMascota({ customMessage }: MascotProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("¡Hola! Soy Varita, tu guía mágica. ✨");
  const [isVisible, setIsVisible] = useState(true);
  const [isWiggling, setIsWiggling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (customMessage) {
      setMessage(customMessage);
      return;
    }

    // Determine message based on route path
    if (pathname === "/") {
      setMessage("¡Hola amiguito! 👋 ¿Listo para crear una aventura mágica hoy?");
    } else if (pathname === "/create") {
      const type = searchParams.get("type") || "";
      if (type.includes("video")) {
        setMessage("¡Elegiste el hechizo supremo con películas animadas! 🎬 ¡Esto será genial!");
      } else {
        setMessage("Escribe tu nombre, selecciona tu avatar de héroe y ¡que comience la magia! 🔮");
      }
    } else if (pathname.startsWith("/stories/detail") || pathname.startsWith("/stories/print")) {
      if (pathname.startsWith("/stories/print")) {
        setMessage("¡Prepara tus colores! Vamos a imprimir tu cuento para leerlo en papel. 🖨️");
      } else {
        setMessage("¡Qué historia tan bonita! 📖 Usa los botones para escuchar y ver las animaciones.");
      }
    } else if (pathname === "/stories") {
      setMessage("¡Aquí están todos tus tesoros! 📚 ¿Cuál cuento quieres leer hoy?");
    }
  }, [pathname, searchParams, customMessage]);

  const handleMascotClick = () => {
    setIsWiggling(true);
    playBubble();
    setTimeout(() => setIsWiggling(false), 1000);

    // Switch messages randomly for fun
    const funPhrases = [
      "¡El poder de la imaginación no tiene límites! 🦄",
      "¡Haz clic en los botones brillantes para activar la magia! 🌟",
      "¿Sabías que los dinosaurios y los astronautas pueden ser amigos? 🦖🧑‍🚀",
      "¡Eres el mejor creador de cuentos del mundo! 🎨",
      "¡Abracadabra, patas de cabra! ✨🪄",
    ];
    if (!customMessage) {
      setMessage(funPhrases[Math.floor(Math.random() * funPhrases.length)]);
    }
  };

  if (isDismissed) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-end gap-3 pointer-events-none no-print transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      {/* Speech Bubble */}
      <div className="relative max-w-xs p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-xs md:text-sm shadow-[0_10px_25px_rgba(249,115,22,0.4)] border border-amber-300/40 pointer-events-auto transition-transform hover:scale-105">
        {/* Triangle arrow */}
        <div className="absolute bottom-4 -right-2 w-4 h-4 bg-orange-500 transform rotate-45 border-r border-t border-amber-300/20" />
        
        <p className="leading-relaxed">{message}</p>
        
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center text-[10px] border border-white/20 transition cursor-pointer"
          title="Ocultar asistente"
        >
          ✕
        </button>
      </div>

      {/* Animated Mascot Figure */}
      <button
        onClick={handleMascotClick}
        className={`w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 via-orange-400 to-amber-500 p-0.5 shadow-[0_10px_30px_rgba(249,115,22,0.5)] border-2 border-white pointer-events-auto hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center justify-center text-3xl ${
          isWiggling ? "wiggle" : "asistente-float"
        }`}
        aria-label="Hablar con Varita"
      >
        ✨🪄
      </button>
    </div>
  );
}
