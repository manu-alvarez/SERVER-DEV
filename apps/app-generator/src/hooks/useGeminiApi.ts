import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useChatStore, Message } from '../store/chatStore';

// Strict Zod schema for validating Gemini API response
const GeminiResponseSchema = z.object({
  candidates: z.array(
    z.object({
      content: z.object({
        parts: z.array(
          z.object({
            text: z.string(),
          })
        ),
      }),
    })
  ),
});

const API_KEYS: string[] = [
  import.meta.env.VITE_GEMINI_API_KEY,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4,
  import.meta.env.VITE_GEMINI_API_KEY_5,
  import.meta.env.VITE_GEMINI_API_KEY_6,
  import.meta.env.VITE_GEMINI_API_KEY_7,
  import.meta.env.VITE_GEMINI_API_KEY_8,
  import.meta.env.VITE_GEMINI_API_KEY_9,
  import.meta.env.VITE_GEMINI_API_KEY_10,
  import.meta.env.VITE_GEMINI_API_KEY_11,
  import.meta.env.VITE_GEMINI_API_KEY_12,
  import.meta.env.VITE_GEMINI_API_KEY_13,
  import.meta.env.VITE_GEMINI_API_KEY_14,
  import.meta.env.VITE_GEMINI_API_KEY_15,
  import.meta.env.VITE_GEMINI_API_KEY_16,
  import.meta.env.VITE_GEMINI_API_KEY_17,
].filter((k): k is string => !!k && k !== "REPLACE_ME_SECRETS");

let currentKeyIndex = 0;

function getNextKey(): string {
  if (API_KEYS.length === 0) return "";
  const key = API_KEYS[currentKeyIndex % API_KEYS.length];
  currentKeyIndex++;
  return key;
}

const SYSTEM_INSTRUCTION = `Eres MSBross APP Generator, un Ingeniero Frontend Experto.
Tu única misión es crear aplicaciones web 100% funcionales, interactivas y asombrosas a partir de prompts.
REGLAS ESTRICTAS:
1. Devuelve ÚNICAMENTE un único bloque de código markdown de HTML (\`\`\`html ... \`\`\`). No añadas explicaciones, saludos ni comentarios fuera del bloque.
2. El HTML debe contener todo: <style> embebido y <script> embebido.
3. Utiliza CDN de TailwindCSS (<script src="https://cdn.tailwindcss.com"></script>) de forma nativa.
4. Utiliza iconos de FontAwesome o lucide si es necesario.
5. Haz que el diseño sea "Glassmorphism", Premium, con Modo Oscuro de lujo y microinteracciones suaves y neón.
6. El código debe ser 100% capaz de ejecutarse dentro de un Iframe sin dependencias de bundlers locales. Escribe Javascript dentro de <script>.`;

export const useGeminiApi = () => {
  const { addMessage, messages } = useChatStore();

  return useMutation({
    mutationFn: async (userPrompt: string) => {
      if (API_KEYS.length === 0) {
        throw new Error('⚠️ No hay API keys de Gemini configuradas.');
      }

      // We need to pass the conversation history. We take current messages from store.
      // Note: In a real architecture, we might want to pass the history directly to avoid closure stale state,
      // but TanStack mutation function executes fresh on call.
      const historyContents = messages.map((m: Message) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Append the new prompt
      historyContents.push({
        role: 'user',
        parts: [{ text: userPrompt }]
      });

      const payload = {
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: historyContents,
        generationConfig: { temperature: 0.7 }
      };

      const maxAttempts = Math.min(API_KEYS.length * 2, 10);
      
      for (let i = 0; i < maxAttempts; i++) {
        const key = getNextKey();
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (response.ok) {
            const data = await response.json();
            // Validate payload with Zod
            const parsed = GeminiResponseSchema.parse(data);
            return parsed.candidates[0].content.parts[0].text;
          }
          
          if (response.status === 429 || response.status === 403) {
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
            continue;
          }
          throw new Error(`API Error: ${response.status}`);
        } catch (e) {
          if (i === maxAttempts - 1) throw e;
        }
      }
      throw new Error("Todas las keys agotadas o fallidas");
    },
    onMutate: (userPrompt) => {
      // Optimistic UI update
      addMessage('user', userPrompt);
    },
    onSuccess: (botResponse) => {
      addMessage('assistant', botResponse);
    },
    onError: (error) => {
      console.error(error);
      addMessage('assistant', error instanceof Error ? error.message : "⚠️ Error desconocido en Gemini.");
    }
  });
};
