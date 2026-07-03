"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getConversations, deleteConversation } from "@/lib/api";
import { useChatStore, useUIStore, useAuthStore } from "@/stores";
import { clearToken } from "@/lib/api";
import { timeAgo, truncate } from "@/lib/utils";
import type { Conversation } from "@/types/chat";
import SettingsModal from "./SettingsModal";

/**
 * Sidebar with conversation list, new chat button, and navigation.
 */
export default function Sidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { conversationId, clearChat, setConversationId, setMessages } = useChatStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const handleNewChat = () => {
    clearChat();
    router.push("/");
  };

  const handleSelectConversation = (conv: Conversation) => {
    setConversationId(conv.id);
    router.push(`/?id=${conv.id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
    if (conversationId === id) clearChat();
    loadConversations();
  };

  const handleLogout = () => {
    clearToken();
    logout();
    router.push("/login");
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      {/* Header */}
      <div style={{ padding: "16px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span className="gradient-text" style={{ fontSize: 18, fontWeight: 700 }}>⚡ JartosDTo</span>
          <button onClick={toggleSidebar} className="btn-ghost" style={{ padding: "4px 8px", border: "none" }}>✕</button>
        </div>
        <button onClick={handleNewChat} className="btn-glow" style={{ width: "100%", padding: "10px 0" }}>
          + New Chat
        </button>
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
        {conversations.length === 0 ? (
          <p style={{ color: "var(--text-tertiary)", fontSize: 13, textAlign: "center", padding: 20 }}>
            No conversations yet
          </p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelectConversation(conv)}
              className={`sidebar-item ${conversationId === conv.id ? "active" : ""}`}
              style={{ justifyContent: "space-between", marginBottom: 2 }}
            >
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {truncate(conv.title, 35)}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
                  {timeAgo(conv.created_at)}
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-tertiary)",
                  cursor: "pointer",
                  fontSize: 14,
                  padding: "2px 6px",
                  borderRadius: 4,
                  opacity: 0.5,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
              >
                🗑
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border-subtle)" }}>
        <button onClick={() => setIsSettingsOpen(true)} className="sidebar-item" style={{ width: "100%", marginBottom: 4 }}>
          ⚙️ Model APIs
        </button>
        {user?.role === "admin" && (
          <button onClick={() => router.push("/admin/dashboard")} className="sidebar-item" style={{ width: "100%", marginBottom: 4 }}>
            🛡️ Admin Panel
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{user?.email}</span>
          <button onClick={handleLogout} className="btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }}>
            Logout
          </button>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </aside>
  );
}
