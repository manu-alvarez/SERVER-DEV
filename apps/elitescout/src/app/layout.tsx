import type { Metadata, Viewport } from "next";
import { inter, playfair } from "@/lib/fonts";
import { Providers } from "@/lib/providers";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

import { ServiceWorkerRegister } from "@/components/ui/ServiceWorkerRegister";

export const metadata: Metadata = {
  metadataBase: new URL("https://msbross.me/app/elitescout"),
  title: "EliteScout — MSBrossAI",
  description: "Plataforma de Scouting y Análisis Deportivo",
  keywords: ["comparador de precios", "análisis de productos", "ofertas", "cupones", "IA"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EliteScout — MSBrossAI",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script id="msbross-config" type="application/json">{`{"apiBase":"__TUNNEL_URL__","NIKOLINA_SERVER":"__TUNNEL_URL__/_atenea","LIVEKIT_URL":"wss://nikolina-1jg7t00i.livekit.cloud"}`}</script>
      </head>
      <body className="antialiased">
        <Providers>
          <ServiceWorkerRegister />
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
