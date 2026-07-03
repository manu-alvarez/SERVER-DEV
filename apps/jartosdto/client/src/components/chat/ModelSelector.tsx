"use client";

import { useState, useEffect } from "react";
import { getModels } from "@/lib/api";
import { useChatStore, useApiStore } from "@/stores";
import type { ModelInfo } from "@/types/chat";

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#10a37f", anthropic: "#cc934f", google: "#4285f4",
  mistral: "#ff7700", ollama: "#e0e0e0", openrouter: "#4f46e5", groq: "#f97316"
};

export default function ModelSelector() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [open, setOpen] = useState(false);
  const { selectedModel, setSelectedModel } = useChatStore();
  const keys = useApiStore(state => state.keys);

  useEffect(() => {
    getModels().then(d => {
      let newModels: ModelInfo[] = [];
      if (Array.isArray(d)) {
        newModels = d;
      } else if (d && typeof d === 'object' && 'models' in d && Array.isArray((d as any).models)) {
        newModels = (d as any).models;
      }
      setModels(newModels);
      
      if (newModels.length > 0) {
        const currentSelected = useChatStore.getState().selectedModel;
        if (!newModels.find(m => m.id === currentSelected)) {
          useChatStore.getState().setSelectedModel(newModels[0].id);
        }
      }
    }).catch(() => {});
  }, [keys]);

  const current = models.find(m => m.id === selectedModel);

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: PROVIDER_COLORS[current?.provider || "openai"] || "#888" }} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>{current?.display_name || selectedModel}</span>
        <span style={{ fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="glass-card" style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, width: 300, maxHeight: 400, overflowY: "auto", zIndex: 100, padding: 6 }}>
          {models.map(m => (
            <button key={m.id} onClick={() => { setSelectedModel(m.id); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", border: "none", borderRadius: 8, background: m.id === selectedModel ? "var(--accent-glow)" : "transparent", color: m.id === selectedModel ? "var(--text-accent)" : "var(--text-primary)", cursor: "pointer", textAlign: "left", fontSize: 13, transition: "background 0.1s" }}
              onMouseEnter={e => { if (m.id !== selectedModel) e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={e => { if (m.id !== selectedModel) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: PROVIDER_COLORS[m.provider] || "#888", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{m.display_name}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
                  {m.provider}{m.is_vision ? " • 👁 Vision" : ""}{m.is_thinking ? " • 🧠 Thinking" : ""}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
