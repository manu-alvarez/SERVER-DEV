/** Chat-related TypeScript types. */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  thinking?: string;
  sources?: Source[];
  model_id?: string;
  attachments?: Attachment[];
  created_at?: string;
}

export interface Source {
  title: string;
  url: string;
  snippet: string;
  relevance_score?: number;
}

export interface Attachment {
  name: string;
  type: string;
  url: string;
}

export interface Conversation {
  id: string;
  title: string;
  model_id?: string;
  agent_id?: string;
  created_at: string;
  updated_at?: string;
  message_count: number;
}

export interface ModelInfo {
  id: string;
  provider: string;
  display_name: string;
  is_vision: boolean;
  is_thinking: boolean;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  system_prompt: string;
  model_id?: string;
  tools: string[];
  is_public: boolean;
}

export interface User {
  id: string;
  email: string;
  display_name?: string;
  role: string;
}

export interface StreamChunk {
  type: "text" | "thinking" | "sources" | "meta" | "usage" | "done" | "error";
  content?: string;
  sources?: Source[];
  conversation_id?: string;
  message_id?: string;
  tokens_input?: number;
  tokens_output?: number;
}
