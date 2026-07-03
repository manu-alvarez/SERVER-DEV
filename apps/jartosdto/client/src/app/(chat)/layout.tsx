"use client";

import Sidebar from "@/components/sidebar/Sidebar";
import ModelSelector from "@/components/chat/ModelSelector";
import { useUIStore, useChatStore } from "@/stores";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <header style={{
          height: "var(--header-height)", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 20px",
          borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-secondary)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {!sidebarOpen && (
              <button onClick={toggleSidebar} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 20 }}>☰</button>
            )}
            <ModelSelector />
          </div>
          <ParameterControls />
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: "hidden" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function ParameterControls() {
  const { temperature, setTemperature, maxTokens, setMaxTokens } = useChatStore();

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
