import React, { useState } from 'react';
import { ChatPanel } from './components/chat/ChatPanel';
import { SandboxPortal } from './components/sandbox/SandboxPortal';
import GodModeListener from './components/GodModeListener';
import ApiConfigModal from './components/ApiConfigModal';
import { Settings } from 'lucide-react';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="bento-layout relative">
      <GodModeListener />
      <ApiConfigModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      {/* Floating Settings Button */}
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="fixed top-4 right-4 z-50 p-3 rounded-xl bg-black/50 border border-white/10 text-white hover:bg-black/70 backdrop-blur-md transition-all cursor-pointer"
        title="Configurar APIs"
      >
        <Settings size={20} />
      </button>

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
