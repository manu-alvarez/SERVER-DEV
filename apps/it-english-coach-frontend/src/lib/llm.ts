import { useAppStore } from '../store';

export const PROVIDERS = {
  custom: { id: "custom", label: "Custom (OpenAI-compatible)", kind: "openai", url: "" },
  openai: { id: "openai", label: "OpenAI", url: "https://api.openai.com/v1/chat/completions", kind: "openai" },
  anthropic: { id: "anthropic", label: "Anthropic", url: "https://api.anthropic.com/v1/messages", kind: "anthropic" },
  gemini: { id: "gemini", label: "Google Gemini", url: "https://generativelanguage.googleapis.com/v1beta/models", kind: "gemini" },
  groq: { id: "groq", label: "Groq", url: "https://api.groq.com/openai/v1/chat/completions", kind: "openai" },
  openrouter: { id: "openrouter", label: "OpenRouter", url: "https://openrouter.ai/api/v1/chat/completions", kind: "openai" }
};

async function readErr(res: Response) {
  try {
    const t = await res.text();
    return t.slice(0, 300);
  } catch(e) {
    return "";
  }
}

function providerFetch(url: string, opts: RequestInit) {
  const { proxyUrl } = useAppStore.getState().settings;
  const px = (proxyUrl || "").trim();
  if (px) {
    const u = px.replace(/\/+$/, "") + "/proxy?url=" + encodeURIComponent(url);
    return fetch(u, opts);
  }
  return fetch(url, opts);
}

async function providerChat(pid: string, messages: {role: string, content: string}[], system?: string) {
  const { settings } = useAppStore.getState();
  const P = PROVIDERS[pid as keyof typeof PROVIDERS];
  const key = settings.keys[pid];
  const model = (settings.models[pid] || "").trim();
  
  if (pid !== "custom" && !key) throw new Error("Missing Key");
  if (pid === "custom" && (!settings.customBase || !key)) throw new Error("Missing Custom Base or Key");
  if (!model) throw new Error("Missing Model");

  if (P.kind === "anthropic") {
    const res = await providerFetch(P.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({ model, max_tokens: 1500, system, messages })
    });
    if (!res.ok) throw new Error("HTTP " + res.status + " · " + await readErr(res));
    const d = await res.json();
    return (d.content || []).map((b: any) => b.type === "text" ? b.text : "").join("\n");
  }

  if (P.kind === "gemini") {
    const url = `${P.url}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    const body: any = { contents, generationConfig: { maxOutputTokens: 1500 } };
    if (system) body.systemInstruction = { parts: [{ text: system }] };
    
    const res = await providerFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("HTTP " + res.status + " · " + await readErr(res));
    const d = await res.json();
    return (d.candidates && d.candidates[0]?.content?.parts || []).map((p: any) => p.text || "").join("");
  }

  // openai-compatible
  const url = pid === "custom" ? settings.customBase.replace(/\/+$/, "") + "/chat/completions" : P.url;
  const msgs = system ? [{ role: "system", content: system }, ...messages] : messages;
  const headers: Record<string, string> = { "Content-Type": "application/json", "Authorization": "Bearer " + key };
  if (pid === "openrouter") {
    headers["HTTP-Referer"] = "https://msbross.me";
    headers["X-Title"] = "IT English Coach";
  }

  const res = await providerFetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, messages: msgs })
  });
  if (!res.ok) throw new Error("HTTP " + res.status + " · " + await readErr(res));
  const d = await res.json();
  return d.choices && d.choices[0] && d.choices[0].message ? d.choices[0].message.content : "";
}

export async function chat(messages: {role: string, content: string}[], system?: string) {
  const { settings } = useAppStore.getState();
  const initialProvider = settings.provider;
  
  // Create fallback chain
  const fallbackOrder = ["gemini", "openai", "groq", "openrouter", "custom"];
  const chain = [initialProvider, ...fallbackOrder.filter(p => p !== initialProvider)];

  let lastError = null;

  for (const pid of chain) {
    try {
      // Check if provider can be used (has key)
      if (pid !== "custom" && !settings.keys[pid]) continue;
      if (pid === "custom" && (!settings.customBase || !settings.keys.custom)) continue;
      if (!settings.models[pid]) continue;

      if (pid !== initialProvider) {
        console.warn(`[Fallback] Primary provider failed. Rotating to fallback: ${pid}`);
      }

      const result = await providerChat(pid, messages, system);
      return result;
    } catch (e: any) {
      console.error(`[Fallback] Provider ${pid} failed:`, e);
      lastError = e;
      // continue to next provider
    }
  }

  throw new Error("Todos los proveedores fallaron. Error final: " + (lastError?.message || "Desconocido"));
}
