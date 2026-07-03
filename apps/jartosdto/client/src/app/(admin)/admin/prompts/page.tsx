"use client";

import { useState } from "react";

export default function PromptsPage() {
  const [prompt, setPrompt] = useState("You are a helpful, accurate, and friendly AI assistant.");

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}><span className="gradient-text">System Prompts</span></h1>
      <p style={{ color: "var(--text-tertiary)", marginBottom: 32 }}>Configure default and custom system prompts</p>

      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Default System Prompt</h3>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          className="input-field" rows={6}
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.6 }} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button className="btn-glow">Save Prompt</button>
        </div>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Prompt Templates</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {[
          { name: "Code Assistant", prompt: "You are an expert programmer..." },
          { name: "Research Analyst", prompt: "You are a research analyst who cites sources..." },
          { name: "Creative Writer", prompt: "You are a creative writer with vivid imagination..." },
          { name: "Data Scientist", prompt: "You are a data science expert..." },
        ].map(t => (
          <div key={t.name} className="glass-card" style={{ padding: 16, cursor: "pointer" }}
            onClick={() => setPrompt(t.prompt)}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{t.prompt.slice(0, 60)}...</div>
          </div>
        ))}
      </div>
    </div>
  );
}
