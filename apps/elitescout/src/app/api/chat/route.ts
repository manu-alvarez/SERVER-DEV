import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    const customHeaders: Record<string, string> = {};
    if (req.headers.get("x-godmode-token")) customHeaders["x-godmode-token"] = req.headers.get("x-godmode-token") as string;
    if (req.headers.get("x-user-custom-keys")) customHeaders["x-user-custom-keys"] = req.headers.get("x-user-custom-keys") as string;
    const isGodMode = !!(customHeaders["x-godmode-token"] || customHeaders["x-user-custom-keys"]);

    const groqKey = process.env.GROQ_KEY || process.env.GROQ_API_KEY || "";
    if (!groqKey && !isGodMode) {
      return NextResponse.json({ error: "Groq API key not configured on server" }, { status: 500 });
    }

    const url = isGodMode ? "http://127.0.0.1:8080/_api/groq/chat/completions" : "https://api.groq.com/openai/v1/chat/completions";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${isGodMode ? "dummy_key" : groqKey}`,
        "Content-Type": "application/json",
        ...customHeaders,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Groq API error: ${res.status} - ${text}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
