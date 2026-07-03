import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const sessionToken = await getServerSession();
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = sessionToken.user.id as string;
    const body = await request.json();
    const { session, programId, dayId, duration } = body;

    // Obtener profile_id
    const profile = await prisma.profile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile no encontrado" }, { status: 404 });
    }

    // Insert WorkoutLog
    const workoutLog = await prisma.workoutLog.create({
      data: {
        id: session.id,
        profileId: profile.id,
        programId: programId || 'none',
        dayId: dayId || 'none',
        startTime: new Date(session.date),
        endTime: new Date(),
        durationSeconds: duration,
        notes: session.notes,
      }
    });

    // Insert sets
    const setsToInsert = [];
    for (const ex of session.exercises) {
      for (const st of ex.sets) {
        setsToInsert.push({
          workoutLogId: workoutLog.id,
          profileId: profile.id,
          exerciseName: ex.name,
          setNumber: st.setNumber,
          weightKg: st.weight,
          reps: st.reps,
          rpe: st.rpe || null,
        });
      }
    }

    if (setsToInsert.length > 0) {
      await prisma.setLog.createMany({
        data: setsToInsert
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
