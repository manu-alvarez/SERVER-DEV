import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeInit } from "@/components/ui/theme-init";
import { AuthProvider } from "@/components/auth/session-provider";
import { SyncManager } from "@/components/auth/sync-manager";

export const metadata: Metadata = {
  title: "TxaFitness — MSBross",
  description: "Plataforma de entrenamiento diario, membresías y control de progreso.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.png" },
  applicationName: "TxaFitness",
  authors: [{ name: "TxaFitness Team" }],
  openGraph: {
    title: "TxaFitness — MSBross",
    description: "Entrena, registra, progresa.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-surface-50 font-sans antialiased">
        <ThemeInit />
        <AuthProvider>
          <SyncManager />
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
