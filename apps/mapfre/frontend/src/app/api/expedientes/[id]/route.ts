import { NextResponse } from "next/server";

const validIds = ["V67391281", "V67391291", "V67391301", "V67391311", "V67391321"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!validIds.includes(id)) {
    return NextResponse.json(
      { error: "Expediente no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: "V67391281",
    description: "Fuga de agua en tubería del baño - Reparación urgente",
    notes: "Piso 3° - Humedad en pared medianera.",
    status: "Completado",
    locality: "Lardero",
    activity: "Fontanería",
    address: "C/ Mayor 23, 3°B",
    policy: "MAPFRE 12345678",
    assignedAt: "2026-06-04 08:30",
    completedAt: "2026-06-04 08:42",
    aiAnalysis: {
      confidence: 0.97,
      reasoning:
        "La descripción indica fuga activa en tubería embebida en pared del baño. Requiere apertura de pared para acceso. Se clasifica como exclusión con cala (YYDDDYT + XADDD2T).",
      codes: [
        { code: "YYDDDYT", description: "Exclusión - Trabajo de apertura y cierre", price: "42.50 €", type: "primary" },
        { code: "XADDD2T", description: "Con cala - Suplemento por apertura en pared", price: "30.00 €", type: "secondary" },
        { code: "SMDDDIT", description: "Material fuera de tarifa", price: "45.00 €", type: "material" },
      ],
      questions: [
        { q: "¿Reutiliza grupo grifería?", a: "No" },
        { q: "¿Requiere andamio?", a: "No" },
        { q: "¿Trabajo en festivo?", a: "No" },
      ],
      displacement: {
        km: 0,
        amount: "0.00 €",
        reason: "Distancia < 20 km (Logrono → Lardero: 4.5 km)",
      },
    },
    timeline: [
      { action: "Expediente asignado", time: "08:30" },
      { action: "Análisis IA completado", time: "08:31" },
      { action: "Formulario rellenado", time: "08:32" },
      { action: "Confirmación humana", time: "08:42" },
    ],
  });
}
