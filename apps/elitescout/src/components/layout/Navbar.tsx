"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

/**
 * Invisible navigation — appears on scroll down, hides when at top.
 */
export function Navbar() {
  const [visible, setVisible] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setVisible(current > 100);
      setLastScroll(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.03]"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-gold font-bold text-sm tracking-wider">
                ELITE
              </span>
              <span className="text-foreground font-light text-sm tracking-wider">
                SCOUT
              </span>
            </Link>

            <div className="flex items-center gap-4 text-xs text-text-muted">
              <Link
                href="/"
                className="hover:text-foreground transition-colors"
              >
                Buscar
              </Link>
              <Link
                href="/family-travel"
                className="hover:text-gold transition-colors"
              >
                🌍 Viajes
              </Link>
              <span className="w-px h-3 bg-white/10" />
              <span className="text-[10px] text-text-muted font-mono">
                v1.0
              </span>
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
