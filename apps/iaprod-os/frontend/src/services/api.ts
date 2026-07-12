import { ApiResponse } from '../types';

const isProduction = window.location.hostname === 'msbross.me' || window.location.hostname === 'iaprod.manuelalvarez.dev';
const API_BASE = isProduction
  ? '/_iaprod/api'
  : ((import.meta as any).env.VITE_API_BASE_URL || `http://${window.location.hostname}:8006/api`);
const API_KEY = (import.meta as any).env.VITE_API_KEY || '';

export const ApiService = {
  async checkHealth(): Promise<boolean> {
    try {
      const url = `${API_BASE}${isProduction ? 'status' : '/status'}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  async sendTextCommand(text: string): Promise<string> {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('msbross_admin_token') : null;
    const customKeys = typeof window !== 'undefined' ? localStorage.getItem('iaprod_custom_keys') : null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    };
    
    if (adminToken) headers['x-msbross-admin-token'] = adminToken;
    if (customKeys) headers['x-custom-api-keys'] = customKeys;

    const res = await fetch(`${API_BASE}/text-command`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: ApiResponse = await res.json();
    const assistantContent = data.response || data.transcript || data.error || 'Sin respuesta';
    
    this.triggerNeuralBridge(text, assistantContent);
    return assistantContent;
  },

  async analyzeVision(base64Image: string, source: 'upload' | 'camera', prompt: string): Promise<string> {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('msbross_admin_token') : null;
    const customKeys = typeof window !== 'undefined' ? localStorage.getItem('iaprod_custom_keys') : null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    };
    
    if (adminToken) headers['x-msbross-admin-token'] = adminToken;
    if (customKeys) headers['x-custom-api-keys'] = customKeys;

    const res = await fetch(`${API_BASE}/vision-analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ image: base64Image, source, prompt }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: ApiResponse = await res.json();
    return data.response || data.error || 'Sin respuesta';
  },

  /**
   * LEVEL 3 ORCHESTRATION: Neural Bridge
   * Intercepts LLM outputs and triggers background tasks across the ecosystem.
   */
  triggerNeuralBridge(userInput: string, assistantOutput: string) {
    const lowerAssistant = assistantOutput.toLowerCase();
    
    if (lowerAssistant.includes('creando tarea') || lowerAssistant.includes('tarea creada') || lowerAssistant.includes('anotado en taskflow')) {
      fetch(`${API_BASE}/vault-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ 
          notification: { type: 'TASK', content: `Nueva tarea desde IAProd: ${userInput.slice(0, 30)}...` },
          app: 'taskflow',
          data: { last_sync: Date.now() }
        })
      }).catch(console.error);
    }

    if (lowerAssistant.includes('temporizador') || lowerAssistant.includes('minutos en industrialpro')) {
      fetch(`${API_BASE}/vault-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ 
          notification: { type: 'TIMER', content: `Timer iniciado desde IAProd` },
          app: 'industrialpro',
          data: { timer_active: true }
        })
      }).catch(console.error);
    }
  }
};
