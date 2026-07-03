import { exec } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";

const execAsync = promisify(exec);

export async function POST() {
  try {
    // We run the python CLI in dry-run mode so it doesn't mutate production without explicit console access
    // This assumes `infocol` is available in the PATH or the venv is activated.
    // For a robust implementation, we provide the full path or rely on the environment.
    const { stdout, stderr } = await execAsync("infocol run --dry-run");
    return NextResponse.json({ success: true, log: stdout, errorLog: stderr });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, log: error.stdout, errorLog: error.stderr },
      { status: 500 }
    );
  }
}
