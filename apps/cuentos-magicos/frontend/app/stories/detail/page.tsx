"use client";

import { Suspense } from "react";
import StoryPlayer from "@/components/StoryPlayer";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchStory } from "@/lib/api";

function StoryDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const [storyData, setStoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError(true);
      return;
    }
    fetchStory(id)
      .then((data) => {
        if (!data) throw new Error();
        setStoryData(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950 text-white p-3 md:p-6 flex items-center justify-center">
        <p className="text-amber-300">Cargando cuento...</p>
      </main>
    );
  }

  if (error || !storyData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950 text-white p-3 md:p-6 flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">No se pudo cargar el cuento.</p>
        <button onClick={() => router.push("/")} className="text-amber-300 hover:underline">Volver al inicio</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950 text-white p-3 md:p-6">
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-amber-300 hover:text-amber-200 transition"
        >
          ← Volver al inicio
        </Link>
      </div>
      <StoryPlayer story={storyData} chapters={storyData.chapters || []} />
    </main>
  );
}

export default function StoryDetailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950 text-white p-3 md:p-6 flex items-center justify-center">
        <p className="text-amber-300">Cargando...</p>
      </main>
    }>
      <StoryDetailContent />
    </Suspense>
  );
}
