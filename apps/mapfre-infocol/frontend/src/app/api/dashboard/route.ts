import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    stats: [
      { label: "Expedientes Hoy", value: "0", change: "0%", trend: "neutral" },
      { label: "Procesados", value: "0", change: "0%", trend: "neutral" },
      { label: "Tiempo Medio", value: "0s", change: "0%", trend: "neutral" },
      { label: "Errores IA", value: "0", change: "0%", trend: "neutral" },
    ],
    recentExpedientes: [],
    tarifaDistribution: [],
    aiConfidence: 0,
    aiTokens: "0",
    aiLatency: "0s",
  });
}
