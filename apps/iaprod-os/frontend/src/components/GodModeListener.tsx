import React, { useEffect } from "react";

export default function GodModeListener() {
  useEffect(() => {
    let tapCount = 0;
    let tapTimeout: ReturnType<typeof setTimeout>;

    const triggerGodMode = () => {
      const pwd = prompt("🔐 Modo Dios (Introduce la clave maestra):\nSi cancelas o dejas en blanco, se desactivará.");
      if (pwd) {
        localStorage.setItem('msbross_admin_token', pwd);
        alert("✅ Clave de Modo Dios guardada. Se usará el proxy de MSBrOSs si es válida.");
        window.location.reload();
      } else if (pwd !== null) {
        localStorage.removeItem('msbross_admin_token');
        alert("❌ Modo Dios Desactivado.");
        window.location.reload();
      }
    };

    const handleTouch = () => {
      tapCount++;
      if (tapCount >= 5) {
        tapCount = 0;
        triggerGodMode();
      }
      clearTimeout(tapTimeout);
      tapTimeout = setTimeout(() => {
        tapCount = 0;
      }, 1500); // 1.5 seconds window to tap 5 times
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        triggerGodMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouch);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouch);
      clearTimeout(tapTimeout);
    };
  }, []);

  return null;
}
