import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../styles/magic-effects.css";
import MagicBackground from "@/components/MagicBackground";

export const metadata: Metadata = {
  metadataBase: new URL("https://msbross.me/app/cuentos-magicos"),
  title: "Cuentos Mágicos",
  description: "Generador de cuentos infantiles personalizados con IA.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cuentos Mágicos — MSBrossAI",
  },
  formatDetection: {
    telephone: false,
  },
  
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/app/cuentos-magicos/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/app/cuentos-magicos/icons/icon-192.png" />
      </head>
      <body className="antialiased relative bg-gradient-to-br from-amber-950 via-stone-950 to-orange-950 min-h-screen text-white">
        <MagicBackground />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
