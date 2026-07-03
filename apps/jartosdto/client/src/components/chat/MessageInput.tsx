"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useChatStore } from "@/stores";

export default function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (content: string, files?: File[]) => void;
  disabled?: boolean;
}) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { webSearchEnabled, setWebSearchEnabled, selectedModel, autoSpeak, setAutoSpeak } = useChatStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "es-ES"; // Or dynamic based on user

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setInput((prev) => prev + (prev.endsWith(" ") ? "" : " ") + currentTranscript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if (!text && files.length === 0) return;
    onSend(text, files.length > 0 ? files : undefined);
    setInput("");
    setFiles([]);
  }, [input, files, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div style={{ padding: "12px 20px 20px", borderTop: "1px solid var(--border-subtle)" }}>
      {files.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-tertiary)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "var(--text-secondary)" }}>
              📎 {f.name.slice(0, 25)}
              <button onClick={() => setFiles(fs => fs.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}>×</button>
            </div>
          ))}
        </div>
      )}
      <div className="glass-card" style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: 8, borderRadius: "var(--radius-lg)" }}>
        <button onClick={() => fileRef.current?.click()} style={{ background: "transparent", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: 8, fontSize: 18, borderRadius: 8 }}>📎</button>
        <input ref={fileRef} type="file" multiple hidden onChange={e => e.target.files && setFiles(Array.from(e.target.files))} />
        <button onClick={() => setWebSearchEnabled(!webSearchEnabled)} style={{ background: webSearchEnabled ? "var(--accent-glow)" : "transparent", border: webSearchEnabled ? "1px solid var(--border-active)" : "none", color: webSearchEnabled ? "var(--text-accent)" : "var(--text-tertiary)", cursor: "pointer", padding: 8, fontSize: 18, borderRadius: 8 }} title={webSearchEnabled ? "Disable web search" : "Enable web search"}>🌐</button>
        <button onClick={() => setAutoSpeak(!autoSpeak)} style={{ background: autoSpeak ? "var(--accent-glow)" : "transparent", border: autoSpeak ? "1px solid var(--border-active)" : "none", color: autoSpeak ? "var(--text-accent)" : "var(--text-tertiary)", cursor: "pointer", padding: 8, fontSize: 18, borderRadius: 8, transition: "all 0.2s" }} title={autoSpeak ? "Disable Auto-Speak" : "Enable Auto-Speak"}>🔊</button>
        <button onClick={toggleListening} style={{ background: isListening ? "rgba(255, 60, 60, 0.2)" : "transparent", border: isListening ? "1px solid rgba(255, 60, 60, 0.5)" : "none", color: isListening ? "#ff4444" : "var(--text-tertiary)", cursor: "pointer", padding: 8, fontSize: 18, borderRadius: 8, transition: "all 0.2s" }} title={isListening ? "Stop listening" : "Start dictation"}>🎙️</button>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Message ${selectedModel}...`} disabled={disabled} rows={1}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 15, fontFamily: "inherit", resize: "none", minHeight: 40, maxHeight: 160, padding: "8px 4px", lineHeight: 1.5 }}
          onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 160) + "px"; }}
        />
        <button onClick={handleSubmit} disabled={disabled || (!input.trim() && files.length === 0)}
          style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: input.trim() ? "linear-gradient(135deg, var(--accent-start), var(--accent-end))" : "var(--bg-tertiary)", color: input.trim() ? "white" : "var(--text-tertiary)", cursor: input.trim() ? "pointer" : "default", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>↑</button>
      </div>
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Using {selectedModel}{webSearchEnabled ? " • 🌐 Web Search" : ""}{autoSpeak ? " • 🔊 Auto-Speak" : ""}</span>
      </div>
    </div>
  );
}
