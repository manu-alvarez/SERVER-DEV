"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ApiConfigModal } from "../ui/ApiConfigModal";

/**
 * Invisible navigation — appears on scroll down, hides when at top.
 */
export function Navbar() {
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.03]">
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
            <button 
              onClick={() => setConfigOpen(true)}
              className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 hover:text-gold transition-colors font-semibold"
            >
              ⚙️ APIs
            </button>
          </div>
        </div>
      </nav>
      <ApiConfigModal isOpen={configOpen} onClose={() => setConfigOpen(false)} />
    </>
  );
}
