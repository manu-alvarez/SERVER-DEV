"use client";

import { useState, useEffect } from "react";
import { getAgents } from "@/lib/api";
import type { Agent } from "@/types/chat";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    getAgents().then(setAgents).catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}><span className="gradient-text">Custom Agents</span></h1>
          <p style={{ color: "var(--text-tertiary)", marginTop: 4 }}>Create and manage AI agents with specific personas</p>
        </div>
        <button className="btn-glow">+ Create Agent</button>
      </div>

      {agents.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧩</div>
          <p style={{ color: "var(--text-secondary)", marginBottom: 8 }}>No agents created yet</p>
          <p style={{ color: "var(--text-tertiary)", fontSize: 13 }}>Create your first custom AI agent with a specific persona, tools, and model</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {agents.map(a => (
            <div key={a.id} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🤖</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{a.model_id || "Default model"}</div>
                </div>
              </div>
              {a.description && <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>{a.description}</p>}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {a.tools.map(t => (
                  <span key={t} style={{ background: "var(--bg-tertiary)", padding: "2px 8px", borderRadius: 10, fontSize: 11, color: "var(--text-accent)" }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
