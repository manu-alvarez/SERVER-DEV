"use client";
import { useEffect } from "react";

export default function GodModeListener() {
  useEffect(() => {
    let tapTimeout: ReturnType<typeof setTimeout>;

    const triggerGodMode = () => {
      const pwd = prompt("🔐 Modo Dios (Introduce la clave maestra):\nSi cancelas o dejas en blanco, se desactivará.");
      if (pwd) {
        localStorage.setItem('msbross_godmode_token', pwd);
        alert("✅ Clave de Modo Dios guardada. Se usará el proxy de MSBrOSs si es válida.");
        window.location.reload();
      } else if (pwd !== null) {
        localStorage.removeItem('msbross_godmode_token');
        alert("❌ Modo Dios Desactivado.");
        window.location.reload();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        tapTimeout = setTimeout(() => {
          triggerGodMode();
        }, 3000); // 3 seconds hold
      }
    };

    const handleTouchEnd = () => {
      clearTimeout(tapTimeout);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        triggerGodMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      clearTimeout(tapTimeout);
    };
  }, []);

  return null;
}
