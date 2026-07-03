"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background">
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="lg:pl-72">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="px-4 pb-16 pt-4 sm:px-6 sm:pt-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
