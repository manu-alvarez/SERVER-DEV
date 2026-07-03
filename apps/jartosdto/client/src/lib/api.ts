/** API client for communicating with the FastAPI backend. */

import { API_URL } from "./utils";
import type { ChatMessage, StreamChunk, Source, ModelInfo, Agent, User } from "../types/chat";
import { useApiStore } from "../stores";

/** Stored auth token. */
let token: string | null = null;

export function setToken(t: string) {
  token = t;
  if (typeof window !== "undefined") localStorage.setItem("token", t);
}

export function getToken(): string | null {
  if (token) return token;
  if (typeof window !== "undefined") return localStorage.getItem("token");
  return null;
}

export function clearToken() {
  token = null;
  if (typeof window !== "undefined") localStorage.removeItem("token");
}

// ── Local Storage DB for Chat History ─────────────────────────
const LOCAL_CONVS_KEY = "jartosdto_conversations";
const LOCAL_MSGS_KEY = "jartosdto_messages";

function getConversationsLocal(): any[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCAL_CONVS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveConversationsLocal(convs: any[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_CONVS_KEY, JSON.stringify(convs));
  }
}

function getMessagesLocal(convId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCAL_MSGS_KEY);
  if (!stored) return [];
  const map = JSON.parse(stored);
  return map[convId] || [];
}

function saveMessagesLocal(convId: string, msgs: ChatMessage[]) {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCAL_MSGS_KEY) || "{}";
    const map = JSON.parse(stored);
    map[convId] = msgs;
    localStorage.setItem(LOCAL_MSGS_KEY, JSON.stringify(map));
  }
}

/** Authenticated fetch wrapper. */
async function apiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const t = getToken();
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string>),
  };
  if (t) headers["Authorization"] = `Bearer ${t}`;
  if (!(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  const baseUrl = typeof window !== "undefined" ? "" : API_URL;
  return fetch(`${baseUrl}/_jartosdto/api/v1${path}`, { ...opts, headers });
}

// ── Auth ──────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  const data = await res.json();
  setToken(data.access_token);
  return data;
}

export async function register(email: string, password: string, displayName?: string) {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, display_name: displayName }),
  });
  if (!res.ok) throw new Error("Registration failed");
  const data = await res.json();
  setToken(data.access_token);
  return data;
}

export async function getMe() {
  const res = await apiFetch("/auth/me");
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

// ── Conversations ─────────────────────────────────────────

export async function getConversations() {
  return getConversationsLocal();
}

export async function getMessages(convId: string) {
  return getMessagesLocal(convId);
}

export async function deleteConversation(convId: string) {
  const convs = getConversationsLocal().filter(c => c.id !== convId);
  saveConversationsLocal(convs);
  
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCAL_MSGS_KEY) || "{}";
    const map = JSON.parse(stored);
    delete map[convId];
    localStorage.setItem(LOCAL_MSGS_KEY, JSON.stringify(map));
  }
}

// ── Models ────────────────────────────────────────────────

export async function getModels(): Promise<ModelInfo[]> {
  const keys = useApiStore.getState().keys;
  let serverModels: ModelInfo[] = [];
  try {
    const res = await apiFetch("/models/", {
      headers: {
        "x-custom-api-keys": JSON.stringify(keys)
      }
    });
    serverModels = await res.json();
  } catch { }
  return serverModels;
}

// ── Agents ────────────────────────────────────────────────

export async function getAgents(): Promise<Agent[]> {
  const res = await apiFetch("/agents/");
  return res.json();
}

// ── Documents ─────────────────────────────────────────────

export async function uploadDocument(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch("/documents/upload", { method: "POST", body: form });
  return res.json();
}

// ── Search ────────────────────────────────────────────────

export async function webSearch(query: string) {
  const res = await apiFetch("/search/web", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
  return res.json();
}

// ── Sandbox ───────────────────────────────────────────────

export async function executeCode(code: string, language = "python") {
  const res = await apiFetch("/sandbox/execute", {
    method: "POST",
    body: JSON.stringify({ code, language }),
  });
  return res.json();
}

// ── Admin ─────────────────────────────────────────────────

export async function getAdminStats() {
  const res = await apiFetch("/admin/stats");
  return res.json();
}

// ── Streaming Chat ────────────────────────────────────────

export async function streamChat(body: {
  model: string;
  messages: { role: string; content: string }[];
  conversation_id?: string;
  web_search?: boolean;
  temperature?: number;
  max_tokens?: number;
}) {
  const t = getToken();
  const keys = useApiStore.getState().keys;
  const baseUrl = typeof window !== "undefined" ? "" : API_URL;

  const targetConvId = body.conversation_id || `conv-${Date.now()}`;
  const userQuery = body.messages[body.messages.length - 1]?.content || "";

  // 1. Save conversation if new
  if (!body.conversation_id) {
    const convs = getConversationsLocal();
    convs.unshift({
      id: targetConvId,
      title: userQuery.length > 25 ? userQuery.slice(0, 25) + "..." : userQuery || "Nueva conversación",
      model_id: body.model,
      created_at: new Date().toISOString(),
      message_count: 2,
    });
    saveConversationsLocal(convs);
  }

  // 2. Save User Message
  const existingMsgs = getMessagesLocal(targetConvId);
  existingMsgs.push({
    id: `m-user-${Date.now()}`,
    role: "user",
    content: userQuery,
    created_at: new Date().toISOString(),
  });
  saveMessagesLocal(targetConvId, existingMsgs);

  // 3. Fetch from backend
  const res = await fetch(`${baseUrl}/_jartosdto/api/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-custom-api-keys": JSON.stringify(keys),
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
    body: JSON.stringify({ ...body, stream: true }),
  });

  if (!res.body) return res;

  // 4. Intercept stream to save Assistant Message
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let fullText = "";
  let fullThinking = "";
  let sources: Source[] = [];

  const stream = new ReadableStream({
    async start(controller) {
      if (!body.conversation_id) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "meta", conversation_id: targetConvId })}\n\n`));
      }
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Pass chunk directly to frontend
        controller.enqueue(value);
        
        // Accumulate data for saving
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split("\n").filter(l => l.trim());
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "text" && data.content) fullText += data.content;
              else if (data.type === "thinking" && data.content) fullThinking += data.content;
              else if (data.type === "sources" && data.sources) sources = data.sources;
            } catch (e) { }
          }
        }
      }
      
      // Save Assistant Message
      const msgs = getMessagesLocal(targetConvId);
      msgs.push({
        id: `m-assistant-${Date.now()}`,
        role: "assistant",
        content: fullText,
        thinking: fullThinking || undefined,
        sources: sources.length > 0 ? sources : undefined,
        created_at: new Date().toISOString(),
        model_id: body.model,
      });
      saveMessagesLocal(targetConvId, msgs);
      
      controller.close();
    }
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" }
  });
}
