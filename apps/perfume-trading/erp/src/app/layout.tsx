import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/shared/Sidebar";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ExchangeRateBadge, CurrencyToggle } from "@/components/ui/currency-display";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { SearchButton } from "@/components/search/SearchButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://msbross.me/app/perfume-trading"),
  title: "Perfume Trading — MSBrossAI",
  description: "Sistema ERP especializado en trading B2B de perfumería. Potenciado por Prisma y Node.js.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          inter.className,
          "bg-[#FAF9F8] dark:bg-[#161616] text-[#323130] dark:text-[#e0e0e0] min-h-screen"
        )}
      >
        <ThemeProvider>
          <GlobalSearch />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 h-screen overflow-y-auto flex flex-col">
              <header className="h-12 bg-[#f43f5e] dark:bg-[#9f1239] text-white flex items-center px-6 justify-between shrink-0">
                <div className="flex items-center space-x-4">
                  <h1 className="text-sm font-semibold tracking-wide">Perfume Trading</h1>
                  <ExchangeRateBadge />
                </div>
                <div className="flex items-center space-x-3">
                  <CurrencyToggle />
                  <SearchButton />
                  <ThemeToggle />
                </div>
              </header>
              <div className="p-6 flex-1">{children}</div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
