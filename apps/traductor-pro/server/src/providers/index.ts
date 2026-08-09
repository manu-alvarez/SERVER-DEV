import OpenAI from 'openai';

export interface AIProvider {
  chat: { completions: { create: (params: any) => Promise<any> } };
  getDefaultModel(): string;
}

export class GroqProvider implements AIProvider {
  private client: OpenAI;

  constructor(customHeaders?: Record<string, string>) {
    let baseURL = 'https://api.groq.com/openai/v1';
    const isGodMode = customHeaders && (customHeaders['x-godmode-token'] || customHeaders['x-user-custom-keys']);
    if (isGodMode) {
      baseURL = 'http://127.0.0.1:8080/_api/groq';
    }
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY || 'dummy_key',
      baseURL,
      defaultHeaders: isGodMode ? customHeaders : undefined,
    });
  }

  get chat() {
    return this.client.chat;
  }

  getDefaultModel(): string {
    return 'llama-3.3-70b-versatile';
  }
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(customHeaders?: Record<string, string>) {
    let baseURL = 'https://api.openai.com/v1';
    const isGodMode = customHeaders && (customHeaders['x-godmode-token'] || customHeaders['x-user-custom-keys']);
    if (isGodMode) {
      baseURL = 'http://127.0.0.1:8080/_api/openai';
    }
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
      baseURL: isGodMode ? baseURL : undefined,
      defaultHeaders: isGodMode ? customHeaders : undefined,
    });
  }

  get chat() {
    return this.client.chat;
  }

  getDefaultModel(): string {
    return 'gpt-4o';
  }
}

export class GeminiProvider implements AIProvider {
  private client: OpenAI;

  constructor(customHeaders?: Record<string, string>) {
    let baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
    const isGodMode = customHeaders && (customHeaders['x-godmode-token'] || customHeaders['x-user-custom-keys']);
    if (isGodMode) {
      baseURL = 'http://127.0.0.1:8080/_api/gemini';
    }
    this.client = new OpenAI({
      apiKey: process.env.GOOGLE_API_KEY || 'dummy_key',
      baseURL,
      defaultHeaders: isGodMode ? customHeaders : undefined,
    });
  }

  get chat() {
    return this.client.chat;
  }

  getDefaultModel(): string {
    return 'gemini-3.1-flash-lite';
  }
}

export class OpenRouterProvider implements AIProvider {
  private client: OpenAI;

  constructor(customHeaders?: Record<string, string>) {
    let baseURL = 'https://openrouter.ai/api/v1';
    const isGodMode = customHeaders && (customHeaders['x-godmode-token'] || customHeaders['x-user-custom-keys']);
    if (isGodMode) {
      baseURL = 'http://127.0.0.1:8080/_api/openrouter';
    }
    this.client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key',
      baseURL,
      defaultHeaders: isGodMode ? customHeaders : undefined,
    });
  }

  get chat() {
    return this.client.chat;
  }

  getDefaultModel(): string {
    return 'meta-llama/llama-3.3-70b-instruct';
  }
}

export class OllamaProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: 'ollama',
      baseURL: process.env.OLLAMA_BASE_URL || 'http://100.100.2.10:11434/v1',
    });
  }

  get chat() {
    return this.client.chat;
  }

  getDefaultModel(): string {
    return process.env.OLLAMA_MODEL || 'gemma3:4b';
  }
}

export class ProviderFactory {
  static create(provider: string, customHeaders?: Record<string, string>): AIProvider {
    switch (provider) {
      case 'openai':
        return new OpenAIProvider(customHeaders);
      case 'gemini':
        return new GeminiProvider(customHeaders);
      case 'openrouter':
        return new OpenRouterProvider(customHeaders);
      case 'ollama':
        return new OllamaProvider(); // Local LLM, no proxy needed
      case 'groq':
      default:
        return new GroqProvider(customHeaders);
    }
  }
}
