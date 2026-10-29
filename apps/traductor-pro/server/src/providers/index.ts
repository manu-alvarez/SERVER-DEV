import OpenAI from 'openai';

export interface AIProvider {
  chat: { completions: { create: (params: any) => Promise<any> } };
  getDefaultModel(): string;
}

export class GroqProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY || 'not_set',
      baseURL: 'https://api.groq.com/openai/v1',
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

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'not_set',
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

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.GOOGLE_API_KEY || 'not_set',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });
  }

  get chat() {
    return this.client.chat;
  }

  getDefaultModel(): string {
    return 'gemini-3.6-flash';
  }
}

export class MistralProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.MISTRAL_API_KEY || 'not_set',
      baseURL: 'https://api.mistral.ai/v1',
    });
  }

  get chat() {
    return this.client.chat;
  }

  getDefaultModel(): string {
    return 'mistral-small-latest';
  }
}

export class NvidiaProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY || 'not_set',
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  }

  get chat() {
    return this.client.chat;
  }

  getDefaultModel(): string {
    return 'nvidia/llama-3.1-nemotron-ultra-253b-v1';
  }
}

export class OllamaProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: 'ollama',
      baseURL: process.env.OLLAMA_BASE_URL || 'http://172.20.0.1:11434/v1',
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
  static create(provider: string): AIProvider {
    switch (provider) {
      case 'openai':
        return new OpenAIProvider();
      case 'gemini':
        return new GeminiProvider();
      case 'mistral':
        return new MistralProvider();
      case 'nvidia':
        return new NvidiaProvider();
      case 'ollama':
        return new OllamaProvider();
      case 'groq':
      default:
        return new GroqProvider();
    }
  }
}
