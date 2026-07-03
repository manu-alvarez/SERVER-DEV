"use client";

import {
  Activity,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Shield,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
  { href: "/expedientes", label: "Expedientes", icon: ClipboardList, badge: "3" },
  { href: "/monitor", label: "Monitor", icon: Activity, badge: null },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<"dark" | "light" | "auto">("dark");
  const cycleTheme = () => {
    const next = theme === "dark" ? "light" : theme === "light" ? "auto" : "dark";
    setThemeState(next);
    if (next === "dark") document.documentElement.classList.remove("light");
    else if (next === "light") document.documentElement.classList.add("light");
    else document.documentElement.classList.remove("light");
  };
  const themeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label="Cerrar menú"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : 0 }}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-border/40 bg-sidebar/95 backdrop-blur-2xl transition-transform duration-300 ease-out lg:translate-x-0",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
        <div className="relative flex h-20 items-center justify-between border-b border-border/30 px-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <Link href="/" onClick={onClose} className="group flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M50 50 C50 30, 30 25, 25 35 C20 45, 30 50, 50 50 Z" fill="white" />
                <path
                  d="M50 50 C70 30, 90 25, 95 35 C100 45, 90 50, 50 50 Z"
                  fill="white"
                  opacity="0.92"
                />
                <path
                  d="M50 50 C50 70, 70 75, 75 65 C80 55, 70 50, 50 50 Z"
                  fill="white"
                  opacity="0.85"
                />
                <path
                  d="M50 50 C30 70, 10 75, 5 65 C0 55, 10 50, 50 50 Z"
                  fill="white"
                  opacity="0.78"
                />
              </svg>
            </motion.div>
            <div className="flex flex-col">
              <span className="text-base font-bold lowercase tracking-tight text-white leading-none">
                mapfre
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
                INFOCOL · v1.0
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/40 hover:text-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
          <Sparkles className="h-3.5 w-3.5 text-primary/60 hidden lg:block" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            Operaciones
          </p>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-white"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white",
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-sidebar-foreground group-hover:text-primary",
                    )}
                  />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                  {isActive && !item.badge && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </div>
              </Link>
            );
          })}

          <p className="px-3 pb-2 pt-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            Sistema
          </p>
          <div className="mb-1 flex items-center gap-1 rounded-xl bg-muted/20 px-2 py-1.5">
            <button
              type="button"
              onClick={cycleTheme}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-white transition-colors"
              title="Cambiar tema"
            >
              {theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : theme === "light" ? <Sun className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
              {theme === "dark" ? "Oscuro" : theme === "light" ? "Claro" : "Auto"}
            </button>
          </div>
          <Link href="/ajustes" onClick={onClose}>
            <div
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                pathname === "/ajustes"
                  ? "bg-primary/10 text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white",
              )}
            >
              {pathname === "/ajustes" && (
                <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Settings
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  pathname === "/ajustes"
                    ? "text-primary"
                    : "text-sidebar-foreground group-hover:text-primary",
                )}
              />
              <span>Ajustes</span>
            </div>
          </Link>
        </nav>

        <div className="border-t border-border/30 p-4">
          <div className="glass-subtle flex items-center gap-3 rounded-2xl p-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-700 text-sm font-bold text-white shadow-lg shadow-primary/20">
                PG
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar bg-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-white">Pedro González</p>
              <p className="truncate text-[11px] text-muted-foreground">Fontanero · La Rioja</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("¿Cerrar sesión de InfoCOL?")) {
                  window.location.href = "/";
                }
              }}
              aria-label="Cerrar sesión"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-primary/5 px-2 py-1.5 text-[10px] font-medium text-primary">
            <Shield className="h-3 w-3" />
            <span>100% local · RGPD</span>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
