"use client";

import { useState } from "react";
import { useApiStore, useChatStore } from "@/stores";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PERSONALITIES = [
  { id: 'default', label: '🤖 Default', desc: 'Balanced and helpful' },
  { id: 'creative', label: '🎨 Creative', desc: 'Imaginative, witty responses' },
  { id: 'formal', label: '👔 Professional', desc: 'Concise and formal' },
  { id: 'sarcastic', label: '😏 Sarcastic', desc: 'Playful, sharp humor' },
  { id: 'teacher', label: '📚 Teacher', desc: 'Explains step by step' },
];

export default function SettingsModal({ isOpen, onClose }: Props) {
  const { keys, setKey, removeKey } = useApiStore();
  const { personality, setPersonality } = useChatStore();
  
  const [localKeys, setLocalKeys] = useState({
    ollama: keys["ollama"] || "",
  });
  const [selectedPersonality, setSelectedPersonality] = useState(personality || 'default');

  if (!isOpen) return null;

  const handleSave = () => {
    if (localKeys.ollama.trim()) {
      setKey("ollama", localKeys.ollama.trim());
    } else {
      removeKey("ollama");
    }
    setPersonality(selectedPersonality);
    onClose();
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)"
    }}>
      <div style={{
        background: "var(--bg-primary)", padding: "24px", borderRadius: "16px",
        width: "90%", maxWidth: "420px", border: "1px solid var(--border-subtle)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
      }}>
        <h2 style={{ marginBottom: "6px", fontSize: "20px", fontWeight: 700 }}>Settings</h2>
        <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginBottom: "24px" }}>
          Customize your JartosDTo experience
        </p>
        
        {/* Personality Selector */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-secondary)", marginBottom: "10px", display: "block" }}>
            AI Personality
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {PERSONALITIES.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPersonality(p.id)}
                style={{
                  background: selectedPersonality === p.id ? "var(--bg-elevated)" : "transparent",
                  border: selectedPersonality === p.id ? "1px solid var(--accent-start)" : "1px solid var(--border-subtle)",
                  color: "#fff",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "14px" }}>{p.label}</span>
                <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Ollama Connection */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-secondary)", marginBottom: "8px", display: "block" }}>
            Ollama URL (Optional)
          </label>
          <input
            type="text"
            value={localKeys.ollama}
            onChange={e => setLocalKeys({ ...localKeys, ollama: e.target.value })}
            placeholder="http://localhost:11434"
            style={{
              background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
              color: "#fff", padding: "10px 14px", borderRadius: "10px", width: "100%", fontSize: "14px"
            }}
          />
          <p style={{ fontSize: "10px", color: "var(--text-tertiary)", marginTop: "4px" }}>
            Connect your local Ollama instance for private models
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", background: "transparent", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "10px", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
          <button onClick={handleSave} style={{ padding: "10px 20px", background: "linear-gradient(135deg, var(--accent-start), var(--accent-end))", border: "none", color: "#fff", borderRadius: "10px", cursor: "pointer", fontWeight: 700, fontSize: "14px" }}>Save</button>
        </div>
      </div>
    </div>
  );
}
