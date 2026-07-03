import OpenAI from 'openai';

export interface AIProvider {
  chat: { completions: any };
  getDefaultModel(): string;
}

export class GroqProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
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
      apiKey: process.env.OPENAI_API_KEY,
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
      apiKey: process.env.GOOGLE_API_KEY,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
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

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }

  get chat() {
    return this.client.chat;
  }

  getDefaultModel(): string {
    return 'meta-llama/llama-3.3-70b-instruct';
  }
}

export class ProviderFactory {
  static create(provider: string): AIProvider {
    switch (provider) {
      case 'openai':
        return new OpenAIProvider();
      case 'gemini':
        return new GeminiProvider();
      case 'openrouter':
        return new OpenRouterProvider();
      case 'groq':
      default:
        return new GroqProvider();
    }
  }
}
