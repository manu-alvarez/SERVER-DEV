import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://msbross.me/app/jartosdto"),
  title: "JartosDTo — MSBrossAI",
  description: "Unified AI Chat Platform with Gemini, ChatGPT, DeepSeek, Qwen & Mistral",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
