"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import StoryForm from "@/components/StoryForm";

function CreateStoryClient() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "text_image_audio";
  return <StoryForm initialContentType={initialType} />;
}

export default function CreateStoryPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-3xl border border-amber-500/30 bg-black/40 backdrop-blur-xl shadow-[0_0_80px_rgba(249,115,22,0.5)] p-4 md:p-8 relative overflow-hidden">
        {/* Decorative glow orbs */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl" aria-hidden="true" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 hover:border-amber-400/50 transition magic-glow wiggle"
            aria-label="Volver"
          >
            <span className="text-xl">←</span>
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Cuentos<span className="shimmer-text text-amber-300">Magicos</span> AI
            </h1>
            <p className="text-sm text-amber-100/60">
              ✨ Crea un cuento personalizado para tu peque ✨
            </p>
          </div>
        </div>

        <Suspense fallback={
          <div className="text-amber-200/50 text-sm p-8 text-center">
            <div className="bounce-gentle text-4xl mb-4">🔮</div>
            Preparando la magia...
          </div>
        }>
          <CreateStoryClient />
        </Suspense>
      </div>
    </main>
  );
}
