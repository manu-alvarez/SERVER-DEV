"use client";

import { AnimatePresence, motion } from "motion/react";
import { Bell, Command, Menu, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

// --- Types & Interfaces ---

export interface AppNotification {
  id: string;
  text: string;
  sub: string;
  time: string;
  unread: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  status: "online" | "offline" | "busy";
  initials: string;
}

interface HeaderProps {
  onMenuClick?: () => void;
  user?: UserProfile;
}

// --- Constants (Mocked Data for decoupling) ---

const MOCK_NOTIFICATIONS: ReadonlyArray<AppNotification> = [
  { id: "notif_1", text: "Expediente V67391281 completado", sub: "12 min · Confianza 97%", time: "hace 2 min", unread: true },
  { id: "notif_2", text: "V67391301 pendiente de revisión", sub: "Códigos seleccionados por IA", time: "hace 15 min", unread: true },
  { id: "notif_3", text: "Sincronización completada", sub: "0 expedientes pendientes", time: "hace 1h", unread: false },
];

const DEFAULT_USER: UserProfile = {
  id: "usr_123",
  name: "Pedro G.",
  status: "online",
  initials: "PG",
};

// --- Main Component ---

export function Header({ onMenuClick, user = DEFAULT_USER }: HeaderProps) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<ReadonlyArray<AppNotification>>(MOCK_NOTIFICATIONS);

  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);

  const handleSearchExecute = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    
    setSearchOpen(false);
    setSearchQuery("");
    
    // Safely encode URI components to prevent HTTP Parameter Pollution (HPP) or XSS
    router.push(`/expedientes?q=${encodeURIComponent(trimmed)}`);
  }, [router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchExecute(searchQuery);
    }
  }, [handleSearchExecute, searchQuery]);

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setNotifOpen(false);
  }, []);

  const handleNavigateSettings = useCallback(() => {
    router.push("/ajustes");
  }, [router]);

  const toggleNotifOpen = useCallback(() => {
    setNotifOpen((prev) => !prev);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.15 }}
      className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/50 bg-card/90 px-4 shadow-lg shadow-black/20 backdrop-blur-xl sm:gap-4 sm:px-6 lg:h-20 lg:px-8"
      role="banner"
    >
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú principal"
        aria-expanded={onMenuClick ? true : false}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-card/40 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Desktop Search */}
      <div className="relative hidden flex-1 sm:block sm:max-w-md" role="search">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar expedientes, códigos, clientes..."
          aria-label="Búsqueda global"
          className="glass-subtle h-10 w-full rounded-xl pl-11 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 rounded-md border border-border/50 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground md:flex" aria-hidden="true">
          <Command className="h-2.5 w-2.5" /> K
        </kbd>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start bg-black/60 pt-16 sm:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Búsqueda en móviles"
          >
            <div className="w-full bg-card/95 px-4 py-4 backdrop-blur-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar expedientes..."
                  aria-label="Búsqueda en móviles"
                  autoFocus
                  className="h-12 w-full rounded-xl border border-primary/30 bg-muted/20 pl-11 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Cerrar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md p-1"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-card/40 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:hidden"
        aria-label="Abrir búsqueda"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleNotifOpen}
            aria-expanded={notifOpen}
            aria-haspopup="dialog"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-card/40 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:h-10 lg:w-10"
            aria-label={`Notificaciones, ${unreadCount} sin leer`}
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white" aria-hidden="true">
                {unreadCount}
              </span>
            )}
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
                  aria-hidden="true"
                />
                <motion.div
                  role="dialog"
                  aria-label="Panel de notificaciones"
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border/40 bg-card shadow-2xl shadow-black/30"
                >
                  <div className="border-b border-border/30 px-4 py-3">
                    <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
                  </div>
                  <div className="max-h-72 overflow-y-auto" role="list">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-sm text-muted-foreground">Sin notificaciones</p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          role="listitem"
                          onClick={() => setNotifOpen(false)}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/20 focus:outline-none focus-visible:bg-muted/30 ${
                            n.unread ? "border-l-2 border-primary bg-primary/[0.02]" : ""
                          }`}
                        >
                          <div
                            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                              n.unread ? "bg-primary" : "bg-transparent"
                            }`}
                            aria-hidden="true"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{n.text}</p>
                            <p className="text-xs text-muted-foreground">{n.sub}</p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground/60">{n.time}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="border-t border-border/30 px-4 py-2.5">
                    <button
                      type="button"
                      className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 focus:outline-none focus-visible:underline"
                      onClick={handleMarkAllRead}
                      disabled={unreadCount === 0}
                    >
                      Marcar todas como leídas
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="mx-1 h-6 w-px bg-border/50 hidden sm:block" aria-hidden="true" />

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          onClick={handleNavigateSettings}
          className="hidden cursor-pointer items-center gap-2.5 rounded-xl border border-border/40 bg-card/40 py-1.5 pl-1.5 pr-3 transition-colors hover:border-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex"
          aria-label={`Perfil de ${user.name}, estado: ${user.status}. Ir a ajustes.`}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-700 text-[11px] font-bold text-white">
            {user.initials}
          </div>
          <div className="text-left text-sm">
            <p className="font-semibold leading-none text-foreground">{user.name}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground capitalize">{user.status}</p>
          </div>
          <div 
            className={cn(
              "ml-1 h-2 w-2 rounded-full shadow-sm",
              user.status === "online" ? "bg-success shadow-success/50" : "bg-muted shadow-muted/50"
            )} 
            aria-hidden="true" 
          />
        </motion.button>
      </div>
    </motion.header>
  );
}
