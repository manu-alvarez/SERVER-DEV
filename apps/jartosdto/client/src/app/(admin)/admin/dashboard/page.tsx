"use client";

import { useState, useEffect } from "react";
import { getAdminStats } from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => {});
  }, []);

  const cards = [
    { label: "Users", value: stats?.total_users ?? "—", icon: "👥", color: "#818cf8" },
    { label: "Conversations", value: stats?.total_conversations ?? "—", icon: "💬", color: "#a78bfa" },
    { label: "Messages", value: stats?.total_messages ?? "—", icon: "📨", color: "#c084fc" },
    { label: "Documents", value: stats?.total_documents ?? "—", icon: "📄", color: "#f472b6" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        <span className="gradient-text">Admin Dashboard</span>
      </h1>
      <p style={{ color: "var(--text-tertiary)", marginBottom: 32 }}>Platform overview and management</p>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 40 }}>
        {cards.map(c => (
          <div key={c.label} className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{c.icon}</span>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color }} />
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Quick Actions</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
        {[
          { label: "Manage Models", desc: "Add, remove, or configure LLM providers", href: "/admin/models", icon: "🤖" },
          { label: "Create Agent", desc: "Build custom AI agents with specific personas", href: "/admin/agents", icon: "🧩" },
          { label: "System Prompts", desc: "Edit default and custom system prompts", href: "/admin/prompts", icon: "📝" },
          { label: "Settings", desc: "Global configuration and hyperparameters", href: "/admin/settings", icon: "⚙️" },
        ].map(a => (
          <a key={a.href} href={a.href} className="glass-card" style={{ padding: 20, textDecoration: "none", display: "block", transition: "border-color 0.15s", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-active)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--glass-border)")}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{a.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{a.label}</div>
            <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>{a.desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
