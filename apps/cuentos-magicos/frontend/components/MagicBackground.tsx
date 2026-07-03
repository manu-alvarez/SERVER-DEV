"use client";

import { useEffect, useState } from "react";
import { startBgMusic, stopBgMusic, isBgMusicPlaying } from "@/lib/bgmusic";

interface MagicBackgroundProps {
  emojiTheme?: string;
}

export default function MagicBackground({ emojiTheme = "✨⭐💫🌙" }: MagicBackgroundProps) {
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; delay: number; duration: number }>>([]);
  const [smoke, setSmoke] = useState<Array<{ id: number; x: number; delay: number }>>([]);
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string; x: number; delay: number; duration: number }>>([]);
  const [musicEnabled, setMusicEnabled] = useState(false);

  useEffect(() => {
    // Generate stars
    const newStars = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 4,
    }));
    setStars(newStars);

    // Generate smoke particles
    const newSmoke = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 10,
    }));
    setSmoke(newSmoke);

    // Generate floating emojis - use array to avoid splitting multi-byte emojis
    const emojis = ["✨", "⭐", "💫", "🧸", "🔮", "🌟", "🌈", "🧡"];
    const newEmojis = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      x: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 6,
    }));
    setFloatingEmojis(newEmojis);

    // Cleanup music on unmount
    return () => {
      stopBgMusic();
    };
  }, []);

  // Cursor trail effect
  useEffect(() => {
    let lastTime = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastTime < 50) return; // Throttle
      lastTime = now;

      const trail = document.createElement("div");
      trail.className = "cursor-trail";
      trail.style.left = `${e.clientX - 6}px`;
      trail.style.top = `${e.clientY - 6}px`;
      document.body.appendChild(trail);
      setTimeout(() => trail.remove(), 600);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Click burst effect
  useEffect(() => {
    const sparkles = ["✨", "⭐", "💫", "🌟", "✦"];
    const handleClick = (e: MouseEvent) => {
      // Burst ring
      const burst = document.createElement("div");
      burst.className = "click-burst";
      burst.style.left = `${e.clientX - 15}px`;
      burst.style.top = `${e.clientY - 15}px`;
      document.body.appendChild(burst);
      setTimeout(() => burst.remove(), 500);

      // Sparkle
      const sparkle = document.createElement("div");
      sparkle.className = "click-sparkle";
      sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
      sparkle.style.left = `${e.clientX - 8}px`;
      sparkle.style.top = `${e.clientY - 8}px`;
      document.body.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 1000);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const toggleMusic = () => {
    if (musicEnabled) {
      stopBgMusic();
      setMusicEnabled(false);
    } else {
      startBgMusic();
      setMusicEnabled(true);
    }
  };

  return (
    <>
      {/* Aurora background */}
      <div className="aurora-bg" aria-hidden="true" />

      {/* Star field */}
      <div className="star-field" aria-hidden="true">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              '--delay': `${star.delay}s`,
              '--duration': `${star.duration}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Floating emojis */}
      <div aria-hidden="true">
        {floatingEmojis.map((emoji) => (
          <div
            key={emoji.id}
            className="floating-emoji"
            style={{
              left: `${emoji.x}%`,
              top: `${20 + Math.random() * 60}%`,
              '--float-delay': `${emoji.delay}s`,
              '--float-duration': `${emoji.duration}s`,
            } as React.CSSProperties}
          >
            {emoji.emoji}
          </div>
        ))}
      </div>

      {/* Smoke/mist at bottom */}
      <div className="smoke-container" aria-hidden="true">
        {smoke.map((particle) => (
          <div
            key={particle.id}
            className="smoke-particle"
            style={{
              left: `${particle.x}%`,
              '--smoke-delay': `${particle.delay}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Music toggle button */}
      <button
        onClick={toggleMusic}
        className="fixed bottom-4 left-4 z-50 w-10 h-10 rounded-full bg-amber-500/30 border border-amber-400/50 backdrop-blur-sm flex items-center justify-center text-lg hover:bg-amber-500/50 transition magic-glow"
        aria-label={musicEnabled ? "Silenciar música" : "Activar música"}
        title={musicEnabled ? "Silenciar música" : "Activar música mágica"}
      >
        {musicEnabled ? "🔊" : "🔇"}
      </button>
    </>
  );
}
