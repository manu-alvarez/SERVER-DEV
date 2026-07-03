import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";

function logTelemetry(action: string, userId: string | null, status: number, error?: any) {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[TELEMETRY][${timestamp}] action=${action} userId=${userId || "unauthenticated"} status=${status} error="${error.message || error}"`);
  } else {
    console.log(`[TELEMETRY][${timestamp}] action=${action} userId=${userId || "unauthenticated"} status=${status}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = await getServerSession();
    if (!sessionToken?.user?.id) {
      logTelemetry("SYNC_GET", null, 401, "No autorizado");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = sessionToken.user.id as string;
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { appState: true }
    });

    if (!profile || !profile.appState) {
      logTelemetry("SYNC_GET", userId, 200);
      return NextResponse.json({ state: null });
    }

    let state;
    try {
      state = JSON.parse(profile.appState);
    } catch (parseError) {
      logTelemetry("SYNC_GET", userId, 500, "Error de parsing JSON local");
      return NextResponse.json({ error: "Estado corrupto" }, { status: 500 });
    }

    logTelemetry("SYNC_GET", userId, 200);
    return NextResponse.json({ state });
  } catch (err) {
    logTelemetry("SYNC_GET", null, 500, err);
    return NextResponse.json({ error: "Error de servidor interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = await getServerSession();
    if (!sessionToken?.user?.id) {
      logTelemetry("SYNC_POST", null, 401, "No autorizado");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = sessionToken.user.id as string;
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      logTelemetry("SYNC_POST", userId, 400, "Payload JSON Invalido");
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    if (!body || !body.state) {
      logTelemetry("SYNC_POST", userId, 400, "Estructura de estado faltante");
      return NextResponse.json({ error: "Estructura inválida" }, { status: 400 });
    }

    // Usar transacción para asegurar que el perfil exista y se actualice atómicamente
    await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findUnique({ where: { userId } });
      if (!profile) {
        throw new Error("Perfil no encontrado");
      }
      
      await tx.profile.update({
        where: { userId },
        data: { appState: JSON.stringify(body.state) }
      });
    });

    logTelemetry("SYNC_POST", userId, 200);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "Perfil no encontrado") {
      logTelemetry("SYNC_POST", null, 404, "Perfil no encontrado");
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }
    logTelemetry("SYNC_POST", null, 500, err);
    return NextResponse.json({ error: "Error de servidor interno" }, { status: 500 });
  }
}
