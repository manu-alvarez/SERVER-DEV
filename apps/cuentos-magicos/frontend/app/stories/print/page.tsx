"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import PrintTrigger from "./PrintTrigger";
import { fetchStory, resolveMediaUrl } from "@/lib/api";

interface Chapter {
  id: string;
  chapter_number: number;
  chapter_title: string;
  chapter_text: string;
  url_image?: string | null;
}

interface StoryData {
  id: string;
  title: string;
  child_name: string;
  child_age: number;
  status: string;
  chapters: Chapter[];
}

function StoryPrintContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const mode = searchParams.get("mode");
  const textOnly = mode === "text";
  
  const [storyData, setStoryData] = useState<StoryData | null>(null);
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
      <div className="max-w-4xl mx-auto bg-white text-black p-8 md:p-12 font-serif min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando versión para imprimir...</p>
      </div>
    );
  }

  if (error || !storyData) {
    return (
      <div className="max-w-4xl mx-auto bg-white text-black p-8 md:p-12 font-serif min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">No se pudo cargar el cuento para imprimir.</p>
        <button onClick={() => router.push("/")} className="text-amber-600 hover:underline">Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white text-black p-8 md:p-12 font-serif min-h-screen" suppressHydrationWarning>
      <PrintTrigger />
      <div className="text-center mb-10 pb-6 border-b-2 border-gray-200">
        <h1 className="text-4xl font-bold mb-2">{storyData.title}</h1>
        <p className="text-lg text-gray-600 italic">Para {storyData.child_name}, {storyData.child_age} años</p>
        {textOnly && (
          <p className="inline-block mt-4 text-xs font-bold uppercase tracking-widest border border-gray-300 px-3 py-1 rounded-full text-gray-500">
            Versión solo texto
          </p>
        )}
      </div>

      {storyData.chapters.map((ch) => (
        <div key={ch.id} className="mb-12 page-break-inside-avoid">
          <h2 className="text-2xl font-bold mb-4">Capítulo {ch.chapter_number}: {ch.chapter_title}</h2>
          {!textOnly && (() => {
            const imgUrl = resolveMediaUrl(ch.url_image);
            return imgUrl ? (
              <div className="mb-6 flex justify-center">
                <img src={imgUrl} alt={ch.chapter_title} className="max-w-full h-auto max-h-[400px] rounded-lg shadow-sm border border-gray-100" />
              </div>
            ) : null;
          })()}
          <div className="text-lg leading-relaxed text-gray-800 whitespace-pre-line text-justify">
            {ch.chapter_text}
          </div>
        </div>
      ))}

      <div className="mt-16 pt-6 border-t border-gray-200 text-center text-sm text-gray-400">
        <p>Generado con Cuentos Mágicos AI</p>
      </div>
    </div>
  );
}

export default function StoryPrintPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto bg-white text-black p-8 md:p-12 font-serif min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    }>
      <StoryPrintContent />
    </Suspense>
  );
}
