/**
 * Google Gemini AI client wrapper.
 * Free tier: 15 RPM, 1M tokens/day with Gemini 2.0 Flash.
 * Used for sentiment analysis, product comparison, and coupon extraction.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";

let genAI: GoogleGenerativeAI | null = null;

/** Get or create Gemini client instance */
function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!API_KEY) {
      throw new Error(
        "GEMINI_API_KEY not set. Get a free key at https://aistudio.google.com"
      );
    }
    genAI = new GoogleGenerativeAI(API_KEY);
  }
  return genAI;
}

/**
 * Send a prompt to Gemini and get a text response.
 * @param systemPrompt - System instructions for the agent
 * @param userContent - User message / data to process
 * @param jsonMode - If true, expects JSON response
 */
export async function generateText(
  systemPrompt: string,
  userContent: string,
  jsonMode = false
): Promise<string> {
  try {
    const client = getClient();
    const model = client.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: systemPrompt,
      generationConfig: jsonMode
        ? { responseMimeType: "application/json" }
        : undefined,
    });

    const result = await model.generateContent(userContent);
    return result.response.text();
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw new Error(`Gemini API error: ${error instanceof Error ? error.message : "Unknown"}`);
  }
}

/**
 * Generate structured JSON from Gemini.
 * Parses the response and returns typed data.
 */
export async function generateJSON<T>(
  systemPrompt: string,
  userContent: string
): Promise<T> {
  const text = await generateText(systemPrompt, userContent, true);

  try {
    // Clean potential markdown code fences
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    console.error("Failed to parse Gemini JSON response:", text.slice(0, 200));
    throw new Error("Invalid JSON from Gemini");
  }
}

/**
 * Stream a response from Gemini for real-time UI updates.
 */
export async function* streamText(
  systemPrompt: string,
  userContent: string
): AsyncGenerator<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: "gemini-3.5-flash",
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContentStream(userContent);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

/** Check if Gemini API key is configured */
export function isConfigured(): boolean {
  return !!API_KEY;
}
