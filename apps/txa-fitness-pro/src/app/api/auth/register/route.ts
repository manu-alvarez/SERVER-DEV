import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hash } from "bcryptjs";

function logTelemetry(action: string, email: string | null, status: number, error?: any) {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[TELEMETRY][${timestamp}] action=${action} email=${email || "unknown"} status=${status} error="${error.message || error}"`);
  } else {
    console.log(`[TELEMETRY][${timestamp}] action=${action} email=${email || "unknown"} status=${status}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      logTelemetry("REGISTER", null, 400, "Payload JSON Invalido");
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }
    
    const { name, email, password } = body;

    if (!email || !password || !name) {
      logTelemetry("REGISTER", email, 400, "Faltan campos requeridos");
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    if (password.length < 6) {
      logTelemetry("REGISTER", email, 400, "Contraseña demasiado corta");
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    // Usar transacción para prevenir condiciones de carrera básicas aunque findUnique/create es casi atómico,
    // en sistemas de alta concurrencia usar upsert o capturar error unique constraint es mejor.
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      logTelemetry("REGISTER", email, 400, "Email ya en uso");
      return NextResponse.json({ error: "Ya existe una cuenta con este email" }, { status: 400 });
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user and empty profile
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        profile: {
          create: {
            displayName: name
          }
        }
      }
    });

    logTelemetry("REGISTER", email, 201);
    return NextResponse.json(
      { message: "Cuenta creada exitosamente", userId: user.id },
      { status: 201 }
    );
  } catch (error: any) {
    logTelemetry("REGISTER", null, 500, error);
    return NextResponse.json(
      { error: "Ha ocurrido un error interno del servidor" },
      { status: 500 }
    );
  }
}
