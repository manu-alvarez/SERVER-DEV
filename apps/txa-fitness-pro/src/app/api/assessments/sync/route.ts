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
    const { fitnessLevel, primaryGoal, weight, targetWeight } = body;

    await prisma.profile.update({
      where: { userId },
      data: {
        fitnessLevel,
        primaryGoal,
        weight,
        targetWeight,
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
