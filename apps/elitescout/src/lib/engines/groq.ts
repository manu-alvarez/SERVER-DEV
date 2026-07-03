/**
 * Groq API Client — Ultra-fast LLM inference.
 * Uses Llama 3.3 70B for structured data extraction.
 * Free tier: 30 RPM, 14400 RPD — much more generous than Gemini free.
 * @see https://console.groq.com
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

/**
 * Check if Groq API key is configured.
 */
export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

/**
 * Generate a text completion using Groq.
 */
export async function groqGenerate(
  systemPrompt: string,
  userContent: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const { temperature = 0.1, maxTokens = 2000 } = options || {};

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API ${response.status}: ${err.slice(0, 200)}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (error) {
    console.error("[Groq] Error:", error);
    throw error;
  }
}

/**
 * Generate structured JSON using Groq.
 */
export async function groqJSON<T>(systemPrompt: string, userContent: string): Promise<T> {
  const raw = await groqGenerate(systemPrompt, userContent);
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Try to extract JSON from markdown code block
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]) as T;

    // Try to find JSON object
    const objMatch = raw.match(/\{[\s\S]*\}/);
    if (objMatch) return JSON.parse(objMatch[0]) as T;

    throw new Error(`Failed to parse Groq JSON response: ${raw.slice(0, 100)}`);
  }
}

/**
 * Get the best available LLM for structured extraction.
 * Priority: Groq (fast + generous) > Gemini (free but limited).
 */
export function getBestLLM(): "groq" | "gemini" | null {
  if (isGroqConfigured()) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
}
