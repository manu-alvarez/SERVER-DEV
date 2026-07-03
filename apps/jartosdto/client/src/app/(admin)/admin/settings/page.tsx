"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    default_model: "gpt-4o",
    default_temperature: 0.7,
    default_top_p: 1.0,
    default_max_tokens: 4096,
    web_search_enabled: true,
    code_sandbox_enabled: true,
    rag_enabled: true,
  });

  const update = (key: string, value: any) => setSettings(s => ({ ...s, [key]: value }));

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}><span className="gradient-text">Settings</span></h1>
      <p style={{ color: "var(--text-tertiary)", marginBottom: 32 }}>Global platform configuration</p>

      {/* Hyperparameters */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Default Hyperparameters</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Temperature ({settings.default_temperature})</label>
            <input type="range" min="0" max="2" step="0.1" value={settings.default_temperature}
              onChange={e => update("default_temperature", parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent-start)" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Top P ({settings.default_top_p})</label>
            <input type="range" min="0" max="1" step="0.05" value={settings.default_top_p}
              onChange={e => update("default_top_p", parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent-start)" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Max Tokens</label>
            <select value={settings.default_max_tokens} onChange={e => update("default_max_tokens", parseInt(e.target.value))}
              className="input-field" style={{ padding: "8px 12px" }}>
              {[1024, 2048, 4096, 8192, 16384, 32768, 65536, 128000].map(v => (
                <option key={v} value={v}>{v.toLocaleString()}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Default Model</label>
            <input className="input-field" value={settings.default_model}
              onChange={e => update("default_model", e.target.value)} style={{ padding: "8px 12px" }} />
          </div>
        </div>
      </div>

      {/* Feature toggles */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Feature Toggles</h3>
        {[
          { key: "web_search_enabled", label: "Web Search (Perplexity-style)", icon: "🌐" },
          { key: "code_sandbox_enabled", label: "Code Sandbox Execution", icon: "💻" },
          { key: "rag_enabled", label: "RAG Document Retrieval", icon: "📄" },
        ].map(f => (
          <div key={f.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{f.icon}</span>
              <span style={{ fontSize: 14 }}>{f.label}</span>
            </div>
            <button onClick={() => update(f.key, !(settings as any)[f.key])}
              style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s",
                background: (settings as any)[f.key] ? "var(--accent-start)" : "var(--bg-hover)" }}>
              <span style={{ position: "absolute", top: 3, transition: "left 0.2s",
                left: (settings as any)[f.key] ? 23 : 3,
                width: 18, height: 18, borderRadius: "50%", background: "white" }} />
            </button>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <button className="btn-glow">Save Settings</button>
        </div>
      </div>
    </div>
  );
}
