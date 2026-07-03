"use client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const tabs = [
    { label: "📊 Dashboard", href: "/admin/dashboard" },
    { label: "🤖 Models", href: "/admin/models" },
    { label: "🧩 Agents", href: "/admin/agents" },
    { label: "📝 Prompts", href: "/admin/prompts" },
    { label: "⚙️ Settings", href: "/admin/settings" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Admin sidebar */}
      <aside style={{ width: 220, background: "var(--bg-secondary)", borderRight: "1px solid var(--border-subtle)", padding: "20px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", marginBottom: 16, textDecoration: "none" }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span className="gradient-text" style={{ fontSize: 16, fontWeight: 700 }}>Admin</span>
        </a>
        {tabs.map(t => (
          <a key={t.href} href={t.href} className="sidebar-item">{t.label}</a>
        ))}
        <div style={{ flex: 1 }} />
        <a href="/" className="sidebar-item">← Back to Chat</a>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, overflowY: "auto", padding: 32, background: "var(--bg-primary)" }}>
        {children}
      </main>
    </div>
  );
}
