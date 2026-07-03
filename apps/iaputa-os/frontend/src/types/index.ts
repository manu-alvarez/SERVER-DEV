export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface ApiResponse {
  response?: string;
  transcript?: string;
  error?: string;
}
