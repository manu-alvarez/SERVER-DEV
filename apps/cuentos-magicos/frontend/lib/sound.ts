/**
 * Motor de síntesis de efectos de sonido mágicos
 * Utiliza Web Audio API nativa para evitar dependencias de archivos externos.
 * Funciona offline y es 100% seguro para PWA.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    // @ts-expect-error - compatibility for old browsers
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Reanuda el contexto si está suspendido (política de autoplay de navegadores)
 */
async function resumeContext(ctx: AudioContext): Promise<boolean> {
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  return ctx.state === "running";
}

/**
 * Sonido de campana mágica (Arpegio ascendente rápido)
 */
export async function playChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const isRunning = await resumeContext(ctx);
    if (!isRunning) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Acorde mayor)

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0, now + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.5);
    });
  } catch (e) {
    console.warn("Error al reproducir audio:", e);
  }
}

/**
 * Sonido de burbuja pop (Barrido rápido de frecuencia ascendente)
 */
export async function playBubble() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const isRunning = await resumeContext(ctx);
    if (!isRunning) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {
    console.warn("Error al reproducir audio:", e);
  }
}

/**
 * Sonido de hechizo stelar (Campanilla con vibrato largo)
 */
export async function playSpell() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const isRunning = await resumeContext(ctx);
    if (!isRunning) return;

    const now = ctx.currentTime;
    
    // Oscilador principal
    const osc = ctx.createOscillator();
    // Oscilador de modulación (Vibrato)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.8); // A6

    lfo.frequency.setValueAtTime(15, now); // 15 Hz vibrato
    lfoGain.gain.setValueAtTime(40, now); // Amplitud del vibrato en Hz

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

    // Conectar modulación
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Conectar salida
    osc.connect(gain);
    gain.connect(ctx.destination);

    lfo.start(now);
    osc.start(now);

    lfo.stop(now + 1.1);
    osc.stop(now + 1.1);
  } catch (e) {
    console.warn("Error al reproducir audio:", e);
  }
}

/**
 * Sonido suave de varita mágica (Tono agudo corto cristalino)
 */
export async function playWand() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const isRunning = await resumeContext(ctx);
    if (!isRunning) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  } catch (e) {
    console.warn("Error al reproducir audio:", e);
  }
}
