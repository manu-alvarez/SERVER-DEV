export type Modo =
  | 'traducir_estandar' | 'traducir' | 'traducir_profesional' | 'traducir_coloquial'
  | 'resumir' | 'traducir_resumir' | 'normal' | 'literal' | 'profesional' | 'coloquial';

export type Nivel = 'breve' | 'normal' | 'detallado';
export type Provider = 'groq' | 'openai' | 'gemini' | 'openrouter';

export interface ProcessPayload {
  texto: string;
  origen: string;
  destino: string;
  modo: Modo;
  nivelResumen: Nivel;
  provider?: Provider;
}

export interface ProcessResult {
  traduccion: string;
  resumen: string;
  provider?: string;
}

export interface ExtrasPayload {
  texto: string;
  herramienta: string;
  provider?: Provider;
}

export interface ExtrasResult {
  resultado: string;
  provider?: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  type: 'traduccion' | 'resumen' | 'extras';
  input: string;
  output: string;
  provider: string;
  sourceLang?: string;
  targetLang?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/_traductor/api';

export async function processText(payload: ProcessPayload): Promise<ProcessResult> {
  const res = await fetch(`${API_BASE}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Error API: ${res.status}`);
  }
  return res.json();
}

export async function processExtras(payload: ExtrasPayload): Promise<ExtrasResult> {
  const res = await fetch(`${API_BASE}/extras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Error API: ${res.status}`);
  }
  return res.json();
}

export async function extractText(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/documents/extract-text`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Error extrayendo texto: ${res.status}`);
  }
  const data = await res.json();
  return data.texto ?? '';
}

export const LANGUAGES = [
  { code: 'auto', label: 'Detectar idioma', flag: '🌐' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'Inglés', flag: '🇺🇸' },
  { code: 'fr', label: 'Francés', flag: '🇫🇷' },
  { code: 'pt', label: 'Portugués', flag: '🇵🇹' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'de', label: 'Alemán', flag: '🇩🇪' },
  { code: 'nl', label: 'Neerlandés', flag: '🇳🇱' },
  { code: 'zh', label: 'Chino', flag: '🇨🇳' },
  { code: 'ja', label: 'Japonés', flag: '🇯🇵' },
  { code: 'ko', label: 'Coreano', flag: '🇰🇷' },
  { code: 'ru', label: 'Ruso', flag: '🇷🇺' },
  { code: 'ar', label: 'Árabe', flag: '🇸🇦' },
];

export const PROVIDERS: { id: Provider; label: string; color: string }[] = [
  { id: 'groq', label: 'Groq', color: '#f55036' },
  { id: 'openai', label: 'OpenAI', color: '#10a37f' },
  { id: 'gemini', label: 'Gemini', color: '#1a73e8' },
  { id: 'openrouter', label: 'OpenRouter', color: '#6a11cb' },
];

export const TRANSLATION_MODES = [
  { id: 'normal', label: '🌍 Estándar' },
  { id: 'literal', label: '📖 Literal' },
  { id: 'profesional', label: '💼 Profesional' },
  { id: 'coloquial', label: '💬 Coloquial' },
];

export const SUMMARY_LEVELS = [
  { id: 'breve', label: '🔍 Breve' },
  { id: 'normal', label: '⚖️ Normal' },
  { id: 'detallado', label: '📚 Detallado' },
];

export const EXTRA_TOOLS = [
  { id: 'keywords', label: '🏷️ Palabras Clave', desc: 'Extrae conceptos y términos clave para SEO o clasificación.' },
  { id: 'sentiment', label: '🎭 Sentimiento y Tono', desc: 'Analiza la actitud (positiva/negativa) y el estilo del mensaje.' },
  { id: 'entities', label: '👥 Extracción de Entidades', desc: 'Identifica personas, lugares, fechas y organizaciones.' },
  { id: 'appbuilder', label: '🚀 Generador de Apps/PWA', desc: 'Crea el código de una web o app funcional desde tu descripción.' },
];
