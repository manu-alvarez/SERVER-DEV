"use client";

import { useState, useEffect } from "react";
import { getModels } from "@/lib/api";
import type { ModelInfo } from "@/types/chat";

export default function ModelsPage() {
  const [models, setModels] = useState<ModelInfo[]>([]);

  useEffect(() => {
    getModels().then(d => {
      if (Array.isArray(d)) {
        setModels(d);
      } else if (d && typeof d === 'object' && 'models' in d && Array.isArray((d as any).models)) {
        setModels((d as any).models);
      } else {
        setModels([]);
      }
    }).catch(() => {});
  }, []);

  const grouped = models.reduce<Record<string, ModelInfo[]>>((acc, m) => {
    (acc[m.provider] = acc[m.provider] || []).push(m);
    return acc;
  }, {});

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}><span className="gradient-text">Model Management</span></h1>
      <p style={{ color: "var(--text-tertiary)", marginBottom: 32 }}>Configure and manage LLM providers</p>

      {Object.entries(grouped).map(([provider, providerModels]) => (
        <div key={provider} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, textTransform: "capitalize" }}>
            {provider} <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>({providerModels.length})</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {providerModels.map(m => (
              <div key={m.id} className="glass-card" style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{m.display_name}</span>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} title="Active" />
                </div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 6 }}>
                  {m.id}{m.is_vision ? " • 👁 Vision" : ""}{m.is_thinking ? " • 🧠 Thinking" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
