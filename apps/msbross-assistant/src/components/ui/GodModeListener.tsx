import { useEffect } from "react";

export default function GodModeListener() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
}
