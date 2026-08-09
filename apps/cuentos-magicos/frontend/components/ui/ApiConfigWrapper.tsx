"use client";
import { useState } from "react";
import { ApiConfigModal } from "./ApiConfigModal";
import GodModeListener from "./GodModeListener";

export default function ApiConfigWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <GodModeListener />
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 hover:text-amber-400 transition-colors font-semibold text-xs text-white backdrop-blur-md shadow-lg border border-white/10"
      >
        ⚙️ APIs
      </button>
      <ApiConfigModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
