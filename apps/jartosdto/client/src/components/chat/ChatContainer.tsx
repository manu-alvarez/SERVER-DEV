"use client";

import { useRef, useEffect, useCallback } from "react";
import { useChatStore } from "@/stores";
import { streamChat } from "@/lib/api";
import type { ChatMessage, StreamChunk } from "@/types/chat";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

/**
 * Main chat container: message list + input.
 * Handles SSE streaming from the FastAPI backend.
 */
export default function ChatContainer() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    messages, addMessage, updateLastAssistant, setIsStreaming,
    isStreaming, selectedModel, webSearchEnabled, conversationId,
    setConversationId, temperature, maxTokens,
  } = useChatStore();

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async (content: string) => {
    // Add user message
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    addMessage(userMsg);

    // Add placeholder assistant message
    const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "", model_id: selectedModel };
    addMessage(assistantMsg);

    setIsStreaming(true);

    try {
      const allMsgs = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const response = await streamChat({
        model: selectedModel,
        messages: allMsgs,
        conversation_id: conversationId || undefined,
        web_search: webSearchEnabled,
        temperature,
        max_tokens: maxTokens,
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let fullThinking = "";
      let sources: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.trim());

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data: StreamChunk = JSON.parse(line.slice(6));
              if (data.type === "text" && data.content) {
                fullText += data.content;
                updateLastAssistant(fullText, fullThinking || undefined);
              } else if (data.type === "thinking" && data.content) {
                fullThinking += data.content;
                updateLastAssistant(fullText, fullThinking);
              } else if (data.type === "sources" && data.sources) {
                sources = data.sources;
              } else if (data.type === "meta" && data.conversation_id) {
                setConversationId(data.conversation_id);
              } else if (data.type === "error") {
                fullText += `\\n\\n⚠️ **Error:** ${data.content}`;
                updateLastAssistant(fullText, fullThinking || undefined);
                break;
              }
            } catch { /* skip malformed chunks */ }
          }
        }
      }

      // Final update with sources
      if (sources.length > 0) {
        const msgs = useChatStore.getState().messages;
        const last = msgs[msgs.length - 1];
        if (last?.role === "assistant") {
          last.sources = sources;
          useChatStore.setState({ messages: [...msgs] });
        }
      }
    } catch (err) {
      updateLastAssistant("⚠️ Error: Could not get a response. Please check your API keys and try again.");
    } finally {
      setIsStreaming(false);
    }
  }, [messages, selectedModel, webSearchEnabled, conversationId, temperature, maxTokens, addMessage, updateLastAssistant, setIsStreaming, setConversationId]);

  return (
    <div className="portal-card" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 32px)", margin: "16px", flex: 1 }}>
      <div className="portal-card-inner" style={{ display: "flex", flexDirection: "column", height: "100%", borderRadius: "18px" }}>
      {/* Messages area */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", paddingTop: 20, paddingBottom: 20 }}>
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={msg.id} message={msg} isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"} />
          ))
        )}
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, var(--accent-start), var(--accent-end))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, boxShadow: "var(--shadow-glow)" }}>⚡</div>
      <h2 className="gradient-text" style={{ fontSize: 28, fontWeight: 700 }}>JartosDTo</h2>
      <p style={{ color: "var(--text-tertiary)", fontSize: 15, maxWidth: 400, textAlign: "center", lineHeight: 1.6 }}>
        Your unified AI chat. Choose a model, enable web search, upload documents, or just start typing.
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {["🔍 Web Search", "📎 Upload Files", "🧠 Deep Thinking", "💻 Code Execution"].map(f => (
          <span key={f} style={{ background: "var(--bg-tertiary)", padding: "6px 14px", borderRadius: 20, fontSize: 12, color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>{f}</span>
        ))}
      </div>
    </div>
  );
}
