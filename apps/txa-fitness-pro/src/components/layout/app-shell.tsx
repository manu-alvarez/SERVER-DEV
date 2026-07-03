"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Activity,
  BarChart3,
  Dumbbell,
  History,
  User,
  Utensils,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Hoy", icon: Dumbbell },
  { href: "/ai-nutrition", label: "Nutrición", icon: Utensils },
  { href: "/log", label: "Historial", icon: History },
  { href: "/progress", label: "Progreso", icon: BarChart3 },
  { href: "/profile", label: "Perfil", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-surface-900/80 backdrop-blur-lg border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-surface-900 dark:text-white text-sm">
              TxaFitness
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-surface-900/90 backdrop-blur-lg border-t border-surface-200 dark:border-surface-700 safe-area-bottom">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors",
                  isActive
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
