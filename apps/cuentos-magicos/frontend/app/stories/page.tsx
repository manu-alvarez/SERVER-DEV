import Link from "next/link";
import StoriesListClient from "@/components/StoriesListClient";

interface StoryItem {
  id: string;
  title: string;
  child_name: string;
  status: string;
  chapter_count: number;
  created_at: string;
}

export default function StoriesPage() {
  const stories: StoryItem[] = [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-amber-950 to-orange-950 text-white relative overflow-hidden font-kid-body py-8 md:py-12">
      {/* Background decorations */}
      <div className="aurora-bg" />
      <div className="star-field">
        <div className="star" style={{ top: "10%", left: "15%", "--duration": "3s", "--delay": "0s" } as React.CSSProperties} />
        <div className="star" style={{ top: "30%", left: "80%", "--duration": "4s", "--delay": "1s" } as React.CSSProperties} />
        <div className="star" style={{ top: "70%", left: "20%", "--duration": "5s", "--delay": "2s" } as React.CSSProperties} />
        <div className="star" style={{ top: "85%", left: "75%", "--duration": "3s", "--delay": "0.5s" } as React.CSSProperties} />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-amber-500/10">
          <div className="text-center sm:text-left">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-amber-300 hover:text-amber-200 transition mb-3"
            >
              ← Volver al inicio
            </Link>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black font-kid-title tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
              📚 Estantería <span className="text-amber-300">Mágica</span>
            </h1>
              0 cuento mágico guardado en tu biblioteca.
          </div>
          
          <Link
            href="/create"
            className="magic-glow px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 font-black text-sm md:text-base shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 transition flex items-center gap-2 select-none"
          >
            ✨ ¡Nuevo Cuento!
          </Link>
        </div>

        {/* Stories List / Library Grid */}
        <StoriesListClient />
      </div>
    </main>
  );
}
