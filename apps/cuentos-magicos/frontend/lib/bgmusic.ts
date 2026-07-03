/**
 * Motor de música de fondo – reproduce harry_potter.mp3 en bucle.
 * Usa HTMLAudioElement puro (sin Web Audio API) para máxima compatibilidad.
 * Fundidos suaves de entrada/salida mediante intervalos de volumen.
 */

let audio: HTMLAudioElement | null = null;
let isPlaying = false;
let fadeTimer: ReturnType<typeof setInterval> | null = null;

/** Contador de generación para anular callbacks asíncronos obsoletos. */
let generation = 0;

const TARGET_VOLUME = 0.30;
const FADE_STEP = 0.02;
const FADE_INTERVAL_MS = 30;

/**
 * Limpia cualquier timer de fade activo.
 */
function clearFade() {
  if (fadeTimer !== null) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }
}

/**
 * Crea el HTMLAudioElement si no existe. Idempotente.
 */
function ensureAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audio) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/app/cuentos-magicos";
    audio = new Audio(`${basePath}/harry_potter.mp3`);
    audio.loop = true;
    audio.volume = 0;
    audio.preload = "auto";
  }
  return audio;
}

/**
 * Inicia la música de fondo con fade-in suave.
 * DEBE llamarse desde un gesto de usuario (click/tap).
 */
export function startBgMusic() {
  const el = ensureAudio();
  if (!el || isPlaying) return;

  clearFade();
  const myGen = ++generation; // Capturar generación actual
  isPlaying = true;
  el.volume = 0;

  el.play()
    .then(() => {
      // Si stopBgMusic se llamó mientras play() estaba pendiente, abortar.
      if (myGen !== generation) return;

      fadeTimer = setInterval(() => {
        if (!audio || myGen !== generation) { clearFade(); return; }
        const next = Math.min(audio.volume + FADE_STEP, TARGET_VOLUME);
        audio.volume = next;
        if (next >= TARGET_VOLUME) clearFade();
      }, FADE_INTERVAL_MS);
    })
    .catch((err) => {
      console.warn("[bgmusic] No pudo iniciarse (autoplay bloqueado?):", err);
      isPlaying = false;
    });
}

/**
 * Detiene la música con fade-out rápido. Siempre ejecuta, sin condiciones.
 */
export function stopBgMusic() {
  if (!audio) return;

  clearFade();
  ++generation; // Invalida cualquier callback pendiente de startBgMusic
  isPlaying = false;

  // Fade out rápido
  fadeTimer = setInterval(() => {
    if (!audio) { clearFade(); return; }
    const next = Math.max(audio.volume - FADE_STEP, 0);
    audio.volume = next;
    if (next <= 0) {
      clearFade();
      audio.pause();
    }
  }, FADE_INTERVAL_MS);
}

/**
 * Devuelve si la música está sonando.
 */
export function isBgMusicPlaying(): boolean {
  return isPlaying;
}

/**
 * Alterna entre reproducir y pausar.
 * @returns El nuevo estado (true = sonando).
 */
export function toggleBgMusic(): boolean {
  if (isPlaying) {
    stopBgMusic();
  } else {
    startBgMusic();
  }
  return isPlaying;
}

