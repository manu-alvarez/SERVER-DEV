"use client";

import { useState } from "react";
import { useApiStore } from "@/stores";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const { keys, setKey, removeKey } = useApiStore();
  const [localKeys, setLocalKeys] = useState({
    openai: keys["openai"] || "",
    anthropic: keys["anthropic"] || "",
    gemini: keys["gemini"] || "",
    groq: keys["groq"] || "",
    openrouter: keys["openrouter"] || "",
    mistral: keys["mistral"] || "",
    minimax: keys["minimax"] || "",
    ollama: keys["ollama"] || "",
    llamacpp: keys["llamacpp"] || "",
    lmstudio: keys["lmstudio"] || "",
    vllm: keys["vllm"] || "",
  });

  if (!isOpen) return null;

  const handleSave = () => {
    Object.entries(localKeys).forEach(([provider, val]) => {
      if (val.trim()) {
        setKey(provider, val.trim());
      } else {
        removeKey(provider);
      }
    });
    onClose();
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 9999
    }}>
      <div style={{
        background: "var(--bg-primary)", padding: "24px", borderRadius: "12px",
        width: "90%", maxWidth: "450px", border: "1px solid var(--border-subtle)"
      }}>
        <h2 style={{ marginBottom: "16px", fontSize: "18px" }}>API Keys Customizadas</h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "20px" }}>
          Configura tus propias claves para usar otros modelos. Estas claves se guardan solo en tu navegador (localStorage).
        </p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", maxHeight: "50vh", paddingRight: "8px" }}>
          {Object.keys(localKeys).map(provider => {
            let placeholder = 'sk-...';
            if (['ollama', 'llamacpp', 'lmstudio', 'vllm'].includes(provider)) {
              placeholder = 'http://127.0.0.1:11434';
            } else if (provider === 'gemini') {
              placeholder = 'AIzaSy...';
            } else if (provider === 'anthropic') {
              placeholder = 'sk-ant-api03-...';
            } else if (provider === 'openrouter') {
              placeholder = 'sk-or-v1-...';
            } else if (provider === 'groq') {
              placeholder = 'gsk_...';
            } else if (provider === 'openai') {
              placeholder = 'sk-proj-...';
            } else if (provider === 'mistral') {
              placeholder = 'Introduce tu API Key...';
            }

            return (
              <div key={provider} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", textTransform: "capitalize", fontWeight: "bold" }}>{provider} {['ollama', 'llamacpp', 'lmstudio', 'vllm'].includes(provider) ? 'Base URL (or Key)' : 'API Key'}</label>
                <input
                  type={['ollama', 'llamacpp', 'lmstudio', 'vllm'].includes(provider) ? 'text' : 'password'}
                  value={localKeys[provider as keyof typeof localKeys]}
                  onChange={e => setLocalKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                  placeholder={placeholder}
                  style={{
                    background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
                    color: "#fff", padding: "8px 12px", borderRadius: "6px"
                  }}
                />
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px", cursor: "pointer" }}>Cancelar</button>
          <button onClick={handleSave} style={{ padding: "8px 16px", background: "var(--accent-primary)", border: "none", color: "#fff", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
