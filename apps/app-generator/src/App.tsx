import React, { useEffect } from 'react';
import { ChatPanel } from './components/chat/ChatPanel';
import { SandboxPortal } from './components/sandbox/SandboxPortal';

export default function App() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + M
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        const token = window.prompt('MSBross Bóveda: Introduce el token maestro para activar el Modo Dios (LLM Proxy):');
        if (token) {
          localStorage.setItem('msbross_admin_token', token);
          alert('Modo Dios activado. Tus peticiones usarán el proxy seguro.');
        } else if (token === '') {
          localStorage.removeItem('msbross_admin_token');
          alert('Modo Dios desactivado. Usando claves públicas.');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="bento-layout relative">
      {/* Dynamic Background Effects */}
      <div className="bg-orbs-container">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>
      
      {/* Components have z-10 for interactivity over background */}
      <div className="z-10 relative bento-chat-wrapper w-full">
        <ChatPanel />
      </div>
      <div className="z-10 relative bento-sandbox-wrapper w-full">
        <SandboxPortal />
      </div>
    </div>
  );
}
