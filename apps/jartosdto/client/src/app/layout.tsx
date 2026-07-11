import type { Metadata } from "next";
import "./globals.css";
import GodModeListener from "@/components/GodModeListener";

export const metadata: Metadata = {
  metadataBase: new URL("https://jartosdto.manuelalvarez.dev"),
  title: "JartosDTo — MSBross",
  description: "Tu asistente Senior IT gruñón",
  icons: { icon: "/icon.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <GodModeListener />
        {children}
      </body>
    </html>
  );
}
