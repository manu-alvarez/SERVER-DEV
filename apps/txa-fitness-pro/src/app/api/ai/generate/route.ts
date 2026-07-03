import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getServerSession } from "next-auth/next";
import { DiagnosticReport } from "@/types/domain";

// Helper de telemetría a Nivel de Producción
function logTelemetry(action: string, status: number, error?: string) {
  const timestamp = new Date().toISOString();
  console.log(`[TELEMETRY][${timestamp}] action=${action} status=${status}${error ? ` error="${error}"` : ""}`);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      logTelemetry("AI_GENERATE", 401, "Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { diagnosticReport } = body as { diagnosticReport: DiagnosticReport };

    // Usar la clave gratuita del servidor (Level 99)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logTelemetry("AI_GENERATE", 500, "Missing GEMINI_API_KEY in env");
      return NextResponse.json({ error: "El servidor no tiene configurada su API Key gratuita." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    if (!diagnosticReport || !diagnosticReport.weakAreas) {
      logTelemetry("AI_GENERATE", 400, "Invalid diagnostic report");
      return NextResponse.json({ error: "Invalid diagnostic report provided" }, { status: 400 });
    }

    const weakAreasList = diagnosticReport.weakAreas
      .map((w) => `- ${w.areaName} (Severidad: ${w.severity}): ${w.justification}`)
      .join("\n");

    const prompt = `Actúa como un Nutricionista y Entrenador Personal experto, amigable y muy empático.
Tu objetivo es crear un plan de nutrición y entrenamiento semanal sencillo y fácil de seguir para una persona normal, basándote en las siguientes áreas de mejora detectadas en su evaluación:

ÁREAS A MEJORAR:
${weakAreasList}

Genera un plan de 7 días (Macro-Ciclo) de forma clara y sin usar jerga médica o términos demasiado técnicos. 
Organiza la respuesta usando los siguientes títulos en formato Markdown (##):

## 1. Tu Enfoque Nutricional
- Sugerencias fáciles y prácticas sobre qué comer (proteínas, carbohidratos, grasas saludables).
- Consejos sobre cuándo comer (antes, durante y después de hacer ejercicio).

## 2. Recomendaciones Extra
- Sugerencias simples de suplementos naturales o vitaminas si fueran necesarios (ej. vitaminas, omega 3), explicando para qué sirven de forma muy sencilla.

## 3. Tu Rutina de Ejercicios
- Cuántos días entrenar a la semana y con qué intensidad para no agotarse.
- Ejercicios recomendados para mejorar específicamente sus puntos débiles de forma segura.

## 4. Plan de Acción Semanal
- Un resumen día a día fácil de leer (qué hacer y recomendaciones de comidas).
- Incluye 3 recetas saludables, riquísimas y muy fáciles de preparar en casa.

Por favor, usa un tono motivador, cercano y coherente. El formato debe ser limpio en Markdown, usando viñetas y negritas para facilitar la lectura.`;

    const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
    });

    logTelemetry("AI_GENERATE", 200);

    return NextResponse.json({ 
        success: true, 
        aiPlan: response.text 
    });

  } catch (error: any) {
    logTelemetry("AI_GENERATE", 500, error.message);
    
    if (error.message?.includes("API key not valid") || error.message?.includes("not found")) {
         return NextResponse.json(
            { error: "La GEMINI_API_KEY del servidor es inválida o expiró." },
            { status: 500 }
        );
    }
    
    return NextResponse.json(
      { error: "Failed to generate AI plan", details: error.message },
      { status: 500 }
    );
  }
}
