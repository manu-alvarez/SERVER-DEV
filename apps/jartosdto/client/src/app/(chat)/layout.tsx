"use client";

import Sidebar from "@/components/sidebar/Sidebar";
import ModelSelector from "@/components/chat/ModelSelector";
import { useUIStore, useChatStore } from "@/stores";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)] relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 md:pl-0">
        {/* Header */}
        <header className="h-[var(--header-height)] flex items-center justify-between px-4 sm:px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
            {!sidebarOpen && (
              <button 
                onClick={toggleSidebar} 
                className="bg-transparent border-none text-[var(--text-secondary)] cursor-pointer text-xl sm:text-2xl hover:text-[var(--text-primary)] transition-colors shrink-0"
                aria-label="Abrir menú"
              >
                ☰
              </button>
            )}
            <div className="min-w-0 truncate flex-1">
              <ModelSelector />
            </div>
          </div>
          <div className="hidden sm:block shrink-0 ml-4">
            <ParameterControls />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";

function ParameterControls() {
  const { temperature, setTemperature, maxTokens, setMaxTokens } = useChatStore();
  const [godMode, setGodMode] = useState(false);

  useEffect(() => {
    setGodMode(!!localStorage.getItem('msbross_admin_token'));
    // Listen for storage changes in case GodMode is activated in another tab or by the listener
    const handleStorageChange = () => setGodMode(!!localStorage.getItem('msbross_admin_token'));
    window.addEventListener('storage', handleStorageChange);
    // Custom event just in case
    const handleCustom = () => setGodMode(!!localStorage.getItem('msbross_admin_token'));
    window.addEventListener('godmode_changed', handleCustom);
    
    // Quick polling to catch changes immediately without full reload
    const interval = setInterval(handleCustom, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('godmode_changed', handleCustom);
      clearInterval(interval);
    }
  }, []);

  if (!godMode) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <label style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Temp</label>
        <input type="range" min="0" max="2" step="0.1" value={temperature}
          onChange={e => setTemperature(parseFloat(e.target.value))}
          style={{ width: 60, accentColor: "var(--accent-start)" }} />
        <span style={{ fontSize: 11, color: "var(--text-secondary)", minWidth: 24 }}>{temperature}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <label style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Tokens</label>
        <select value={maxTokens} onChange={e => setMaxTokens(parseInt(e.target.value))}
          style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", borderRadius: 6, color: "var(--text-secondary)", padding: "2px 6px", fontSize: 11 }}>
          {[1024, 2048, 4096, 8192, 16384, 32768].map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
