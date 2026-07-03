"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { playBubble, playSpell, playChime } from "@/lib/sound";

const AVATARS = [
  { id: "astronaut", label: "Astronauta", emoji: "🧑‍🚀", desc: "Viajero espacial" },
  { id: "unicorn", label: "Unicornio Mágico", emoji: "🦄", desc: "Criatura de fantasía" },
  { id: "dinosaur", label: "Dinosauro Valiente", emoji: "🦖", desc: "Fuerte y curioso" },
  { id: "fairy", label: "Hada del Bosque", emoji: "🧚‍♀️", desc: "Espíritu de la naturaleza" },
  { id: "alien", label: "Alienígena Amigo", emoji: "👽", desc: "Explorador galáctico" },
  { id: "superhero", label: "Superhéroe", emoji: "🦸‍♂️", desc: "Defensor del bien" },
];

const VALUES_OPTIONS = [
  { id: "amistad", label: "Amistad", emoji: "🤝💫" },
  { id: "compartir", label: "Compartir", emoji: "🎁🤲" },
  { id: "ser amable", label: "Ser amable", emoji: "🌸💕" },
  { id: "ser valiente", label: "Ser valiente", emoji: "🦁💪" },
  { id: "no rendirse", label: "Superarse", emoji: "🌟⭐" },
  { id: "ayudar a otros", label: "Ayuda mutua", emoji: "🤝💖" },
  { id: "ser honesto", label: "Sinceridad", emoji: "🌈✨" },
  { id: "cuidar la naturaleza", label: "Ecológico", emoji: "🌳🌱" },
  { id: "respetar a otros", label: "Respeto", emoji: "🙏💛" },
  { id: "trabajar en equipo", label: "Equipo", emoji: "👫🎯" },
];

const THEMES = [
  { id: "Viaje espacial", emoji: "🚀🌕", label: "Viaje Espacial" },
  { id: "Princesas y caballeros", emoji: "👸🤴", label: "Reino de Fantasía" },
  { id: "Animales amigos", emoji: "🐻🌳", label: "Animales Amigos" },
  { id: "Superheroes", emoji: "🦸‍♂️✨", label: "Súper Héroes" },
  { id: "Pezecitos de colores", emoji: "🐠🌊", label: "Océano de Colores" },
  { id: "Fantasias y magia", emoji: "🪄🌟", label: "Magia y Hechizos" },
  { id: "Dinosaurios", emoji: "🦕🦖", label: "Mundo Dinosaurio" },
  { id: "Otra aventura...", emoji: "🌈🎨", label: "¡Otra aventura!" },
];

const CONTENT_TYPES = [
  { id: "text", icon: "📖", label: "Solo Texto", desc: "Lectura tradicional" },
  { id: "text_image", icon: "🎨", label: "Texto + Dibujos", desc: "Con hermosas imágenes" },
  { id: "text_image_audio", icon: "🎙️", label: "Audiolibro", desc: "Voz narradora" },
  // { id: "text_image_audio_video", icon: "🎬", label: "Cine Animado", desc: "Con películas de IA" },
];

interface StoryFormProps {
  initialContentType?: string;
}

export default function StoryForm({ initialContentType = "text_image_audio" }: StoryFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(6);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [theme, setTheme] = useState(THEMES[0].id);
  const [customTheme, setCustomTheme] = useState("");
  const [values, setValues] = useState<string[]>(["amistad"]);
  const [duration, setDuration] = useState<"short" | "medium" | "long">("short");
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [contentType, setContentType] = useState(initialContentType);

  const toggleValue = (value: string) => {
    playBubble();
    setValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleAvatarSelect = (avatar: typeof AVATARS[0]) => {
    playBubble();
    setSelectedAvatar(avatar);
  };

  const handleThemeSelect = (themeId: string) => {
    playBubble();
    setTheme(themeId);
  };

  const handleNextStep = () => {
    if (step === 1 && !childName.trim()) {
      setError("¡Por favor, escribe el nombre del héroe!");
      return;
    }
    setError("");
    playChime();
    setStep((s) => s + 1);
  };

  const handlePrevStep = () => {
    setError("");
    playBubble();
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await playSpell();

    let finalTheme = theme === "Otra aventura..." ? customTheme : theme;
    // Embed the chosen avatar directly into the theme description so DALL-E and GPT-4o respect it!
    finalTheme = `${finalTheme} (El protagonista es un/a ${selectedAvatar.label} llamado/a ${childName})`;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:8007` : "http://localhost:8007");
      const res = await fetch(`${apiBase}/api/stories/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_name: childName,
          child_age: childAge,
          theme: finalTheme,
          values,
          duration,
          language,
          content_type: contentType,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Ha fallado el hechizo de creación.");
      }

      const data = await res.json();
      router.push(`/stories/detail?id=${data.story_id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getStepGuideText = () => {
    switch (step) {
      case 1: return `¡Hola! Escribe tu nombre y elige la apariencia de tu héroe. 🧑‍🚀🦄`;
      case 2: return `¿Hacia dónde nos llevará la imaginación hoy? Elige un escenario. 🚀🦖`;
      case 3: return `¿Qué gran valor o lección queremos transmitir en este cuento? 🌸🤝`;
      case 4: return `Elige cuánto durará la aventura y en qué idioma quieres escucharla. ⏱️🌍`;
      case 5: return `¡Último paso! Elige el tipo de magia y formato de tu cuento. 🪄🎬`;
      default: return "";
    }
  };

  return (
    <div className="space-y-6 font-kid-body">
      {/* Visual step indicators */}
      <div className="flex justify-between items-center max-w-md mx-auto mb-6 select-none">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => s < step && setStep(s)}
              disabled={s >= step}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-kid-title text-base font-black transition-all ${
                s === step
                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-[0_0_15px_rgba(251,191,36,0.6)] scale-110"
                  : s < step
                  ? "bg-amber-500 text-white cursor-pointer hover:bg-amber-400"
                  : "bg-white/10 text-white/40 cursor-not-allowed"
              }`}
            >
              {s}
            </button>
            {s < 5 && (
              <div className={`flex-1 h-1.5 mx-2 rounded-full ${s < step ? "bg-amber-500" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Mascot bubble guide inside the form */}
      <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 flex items-center gap-3">
        <div className="text-3xl animate-bounce">✨🪄</div>
        <div className="text-sm font-semibold text-amber-200">
          {getStepGuideText()}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* STEP 1: Hero Identity */}
        {step === 1 && (
          <div className="space-y-6 fade-in-up">
            <h2 className="text-xl font-black font-kid-title text-amber-200 mb-4 flex items-center gap-2">
              <span>🚀</span> Misión 1: ¿Quién es el Héroe?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-amber-200 font-bold text-base">Nombre del niño o niña</span>
                <input
                  className="px-5 py-4 rounded-2xl bg-amber-950/60 border-3 border-amber-500/40 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 text-white text-base placeholder-amber-400/40 transition font-bold"
                  value={childName}
                  required
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Ej: Sofia o Lucas"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="text-amber-200 font-bold text-base">Edad</span>
                <div className="relative">
                  <select
                    className="w-full px-5 py-4 rounded-2xl bg-amber-950/60 border-3 border-amber-500/40 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 text-white font-bold text-base cursor-pointer appearance-none"
                    value={childAge}
                    onChange={(e) => setChildAge(Number(e.target.value))}
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 2).map((age) => (
                      <option key={age} value={age} className="bg-amber-950 text-white font-bold">
                        {age} años
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-amber-300">
                    ▼
                  </div>
                </div>
              </label>
            </div>

            {/* Avatar character selector */}
            <div className="space-y-3">
              <span className="text-amber-200 font-bold text-base block">¡Elige tu Avatar de Héroe!</span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVATARS.map((av) => {
                  const active = selectedAvatar.id === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => handleAvatarSelect(av)}
                      className={`float-avatar rounded-2xl border-3 p-3 transition text-left cursor-pointer flex items-center gap-3 ${
                        active
                          ? "bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                          : "bg-white/5 border-white/10 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="text-4xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{av.emoji}</div>
                      <div>
                        <div className="font-black text-xs md:text-sm font-kid-title text-white">{av.label}</div>
                        <div className="text-[10px] text-amber-200/60 leading-none mt-0.5">{av.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: The Adventure Scenario */}
        {step === 2 && (
          <div className="space-y-6 fade-in-up">
            <h2 className="text-xl font-black font-kid-title text-orange-300 mb-4 flex items-center gap-2">
              <span>🗺️</span> Misión 2: Escenario de la Aventura
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {THEMES.map((t) => {
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleThemeSelect(t.id)}
                    className={`rounded-2xl border-3 p-4 transition flex flex-col items-center justify-center text-center cursor-pointer h-28 ${
                      active
                        ? "bg-orange-500/20 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-105"
                        : "bg-white/5 border-white/10 opacity-70 hover:opacity-100 hover:scale-102"
                    }`}
                  >
                    <span className="text-4xl mb-2 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{t.emoji}</span>
                    <span className="font-extrabold text-xs md:text-sm font-kid-title leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {theme === "Otra aventura..." && (
              <div className="space-y-2 fade-in-up">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-amber-200 font-bold">Describe tu propia aventura mágica</span>
                  <input
                    className="px-5 py-4 rounded-2xl bg-amber-950/60 border-3 border-amber-500/40 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 text-white font-bold"
                    value={customTheme}
                    required
                    onChange={(e) => setCustomTheme(e.target.value)}
                    placeholder="Ej: Un mono gracioso que busca un plátano de oro en la selva..."
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Educational values */}
        {step === 3 && (
          <div className="space-y-6 fade-in-up">
            <h2 className="text-xl font-black font-kid-title text-yellow-300 mb-4 flex items-center gap-2">
              <span>💖</span> Misión 3: La Gran Lección del Cuento
            </h2>
            
            <p className="text-amber-200/80 text-sm font-semibold mb-4">
              Selecciona uno o más valores que deseas que tu hijo aprenda a lo largo del viaje:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {VALUES_OPTIONS.map((v) => {
                const active = values.includes(v.id);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggleValue(v.id)}
                    className={`px-4 py-3 rounded-full border-3 text-xs md:text-sm transition flex items-center justify-center gap-2 cursor-pointer font-bold ${
                      active
                        ? "bg-yellow-500/20 border-yellow-400 text-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-102"
                        : "bg-white/5 border-white/10 opacity-70 hover:opacity-100 hover:border-white/20"
                    }`}
                  >
                    <span className="text-base">{v.emoji}</span>
                    <span>{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Duration and Language */}
        {step === 4 && (
          <div className="space-y-6 fade-in-up">
            <h2 className="text-xl font-black font-kid-title text-emerald-400 mb-4 flex items-center gap-2">
              <span>⏱️</span> Misión 4: Duración e Idioma
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="flex flex-col gap-2">
                <span className="text-amber-200 font-bold text-base">Duración aproximada</span>
                <div className="flex gap-3">
                  {[
                    { id: "short" as const, label: "Corto 📖" },
                    { id: "medium" as const, label: "Medio 📖📖" },
                    { id: "long" as const, label: "Largo 📖📖📖" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { playBubble(); setDuration(opt.id); }}
                      className={`flex-1 py-3 rounded-2xl border-3 transition font-extrabold cursor-pointer text-xs md:text-sm ${
                        duration === opt.id
                          ? "bg-orange-500/20 border-orange-400 text-orange-200"
                          : "bg-orange-950/40 text-orange-100 border-orange-500/30 hover:border-orange-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-amber-200 font-bold text-base">Idioma del Reino</span>
                <div className="flex gap-3">
                  {[
                    { id: "es" as const, label: "Español 🇪🇸" },
                    { id: "en" as const, label: "English 🇬🇧" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { playBubble(); setLanguage(opt.id); }}
                      className={`flex-1 py-3 rounded-2xl border-3 transition font-extrabold cursor-pointer text-xs md:text-sm ${
                        language === opt.id
                          ? "bg-yellow-500/20 border-yellow-400 text-yellow-200"
                          : "bg-yellow-950/40 text-yellow-100 border-yellow-500/30 hover:border-yellow-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Format of the Magic */}
        {step === 5 && (
          <div className="space-y-6 fade-in-up">
            <h2 className="text-xl font-black font-kid-title text-orange-300 mb-4 flex items-center gap-2">
              <span>🎬</span> Misión 5: Formato de la Magia
            </h2>
            
            <div className="flex flex-col gap-3 text-sm">
              <span className="text-amber-200 font-bold text-base">Tipo de Contenido Mágico</span>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {CONTENT_TYPES.map((ct) => {
                  const active = contentType === ct.id;
                  return (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => { playBubble(); setContentType(ct.id); }}
                      className={`rounded-2xl border-3 p-4 text-left transition cursor-pointer flex flex-col justify-between h-32 ${
                        active
                          ? "bg-orange-500/20 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)] scale-102"
                          : "bg-white/5 border-white/10 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div>
                        <div className="text-3xl mb-1 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{ct.icon}</div>
                        <div className="font-black text-xs md:text-sm font-kid-title leading-tight">{ct.label}</div>
                      </div>
                      <div className="text-[10px] text-amber-200/50 leading-tight mt-1">{ct.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/20 border-3 border-rose-500/40 text-rose-200 text-sm font-bold animate-bounce">
            ⚠️ {error}
          </div>
        )}

        {/* Navigation actions */}
        <div className="flex items-center justify-between gap-4 border-t border-amber-500/20 pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-6 py-3.5 rounded-2xl border-3 border-amber-500/30 bg-amber-950/40 font-black text-sm md:text-base cursor-pointer hover:bg-amber-950/80 transition"
            >
              ← Misión Anterior
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 font-black text-sm md:text-base shadow-lg cursor-pointer hover:brightness-110 active:scale-95 transition"
            >
              Siguiente Misión →
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="magic-glow px-10 py-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 to-amber-600 font-black text-base md:text-lg shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer select-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creando Cuento Mágico...
                </span>
              ) : (
                "✨ ¡Desatar Magia! ✨"
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
