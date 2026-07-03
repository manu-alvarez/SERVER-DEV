"use client";

import { AnimatePresence, motion } from "motion/react";
import { Bell, Command, Menu, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const notifications = [
  { id: 1, text: "Expediente V67391281 completado", sub: "12 min · Confianza 97%", time: "hace 2 min", unread: true },
  { id: 2, text: "V67391301 pendiente de revisión", sub: "Códigos seleccionados por IA", time: "hace 15 min", unread: true },
  { id: 3, text: "Sincronización completada", sub: "0 expedientes pendientes", time: "hace 1h", unread: false },
];

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const doSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/expedientes?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.15 }}
      className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/50 bg-card/90 px-4 shadow-lg shadow-black/20 backdrop-blur-xl sm:gap-4 sm:px-6 lg:h-20 lg:px-8"
    >
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-card/40 text-muted-foreground hover:text-foreground lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="relative hidden flex-1 sm:block sm:max-w-md">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch(searchQuery)}
          placeholder="Buscar expedientes, códigos, clientes..."
          className="glass-subtle h-10 w-full rounded-xl pl-11 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 rounded-md border border-border/50 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground md:flex">
          <Command className="h-2.5 w-2.5" /> K
        </kbd>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start bg-black/60 pt-16 sm:hidden"
          >
            <div className="w-full bg-card/95 px-4 py-4 backdrop-blur-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearch(searchQuery)}
                  placeholder="Buscar expedientes, códigos..."
                  autoFocus
                  className="h-12 w-full rounded-xl border border-primary/30 bg-muted/20 pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-card/40 text-muted-foreground hover:text-foreground sm:hidden"
        aria-label="Buscar"
      >
        <Search className="h-4 w-4" />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-card/40 text-muted-foreground hover:text-foreground transition-colors lg:h-10 lg:w-10"
            aria-label="Notificaciones"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
              {notifications.filter((n) => n.unread).length}
            </span>
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40"
                  onClick={() => setNotifOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border/40 bg-card shadow-2xl shadow-black/30"
                >
                  <div className="border-b border-border/30 px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">Notificaciones</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/20 ${
                          n.unread ? "border-l-2 border-primary bg-primary/[0.02]" : ""
                        }`}
                      >
                        <div
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                            n.unread ? "bg-primary" : "bg-transparent"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">{n.text}</p>
                          <p className="text-xs text-muted-foreground">{n.sub}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground/60">{n.time}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border/30 px-4 py-2.5">
                    <button
                      type="button"
                      className="w-full text-center text-xs font-medium text-primary hover:text-primary/80"
                      onClick={() => setNotifOpen(false)}
                    >
                      Marcar todas como leídas
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="mx-1 h-6 w-px bg-border/50 hidden sm:block" />

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          onClick={() => (window.location.href = "/ajustes")}
          className="hidden cursor-pointer items-center gap-2.5 rounded-xl border border-border/40 bg-card/40 py-1.5 pl-1.5 pr-3 transition-colors hover:border-primary/30 sm:flex"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-700 text-[11px] font-bold text-white">
            PG
          </div>
          <div className="text-left text-sm">
            <p className="font-semibold leading-none text-foreground">Pedro G.</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Online</p>
          </div>
          <div className="ml-1 h-2 w-2 rounded-full bg-success shadow-sm shadow-success/50" />
        </motion.button>
      </div>
    </motion.header>
  );
}
