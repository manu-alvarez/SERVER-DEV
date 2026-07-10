import React from 'react';
import { ChatPanel } from './components/chat/ChatPanel';
import { SandboxPortal } from './components/sandbox/SandboxPortal';

export default function App() {
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
