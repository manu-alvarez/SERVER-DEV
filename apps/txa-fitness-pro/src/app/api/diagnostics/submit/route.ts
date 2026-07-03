import { NextRequest, NextResponse } from "next/server";
import { processDiagnosticAssessment } from "@/lib/engine";
import { AnswerSubmission, UserContext } from "@/types/domain";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, userProfile } = body as {
      answers: AnswerSubmission[];
      userProfile: UserContext;
    };

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "Answers array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (!userProfile?.id) {
      return NextResponse.json(
        { error: "User profile with valid id is required" },
        { status: 400 }
      );
    }

    const report = await processDiagnosticAssessment(answers, userProfile);

    return NextResponse.json(
      {
        success: true,
        data: report,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Diagnostic submission error:", error);
    return NextResponse.json(
      { error: "Internal server error processing diagnostic assessment" },
      { status: 500 }
    );
  }
}
