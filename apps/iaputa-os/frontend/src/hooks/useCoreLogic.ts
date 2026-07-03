import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, OrbState } from '../types';
import { ApiService } from '../services/api';

const OFFLINE_REPLIES: Record<string, string> = {
  hola: '¡Hola! Soy IAPuta OS, tu asistente IA personal de élite. ¿En qué puedo ayudarte hoy?',
  hello: 'Hello! I am IAPuta OS, your luxury AI assistant. How can I act for you?',
  ayuda: 'Tengo acceso a:\n• 📷 Análisis de visión y pantalla\n• 🌐 Búsquedas avanzadas\n• 💻 Shell y manipulación local\n• 🧠 Multi-LLM en fallback',
  default: 'Entendido. El backend local no está accesible en este momento. Por favor levanta la API de FastAPI para funcionalidad completa.',
};

export function useCoreLogic() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    ApiService.checkHealth().then(isHealthy => setOfflineMode(!isHealthy));
  }, []);

  const addMessage = useCallback((role: Message['role'], content: string) => {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role, content, timestamp: new Date() }]);
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const cleanText = text.replace(/[*#_`~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const bestVoice = voices.find(v => v.name === 'Google español')
        || voices.find(v => v.lang.startsWith('es') && v.name.includes('Premium'))
        || voices.find(v => v.lang.startsWith('es') && ['Monica', 'Jorge', 'Diego'].some(n => v.name.includes(n)))
        || voices.find(v => v.lang.startsWith('es-ES'))
        || voices.find(v => v.lang.startsWith('es'));
                   
      if (bestVoice) utterance.voice = bestVoice;
      
      utterance.lang = 'es-ES';
      utterance.rate = 1.2;
      utterance.pitch = 1.05; 
      utterance.onstart = () => { setSpeaking(true); setOrbState('speaking'); };
      utterance.onend = () => { setSpeaking(false); setOrbState('idle'); };
      utterance.onerror = () => { setSpeaking(false); setOrbState('idle'); };
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      let hasFired = false;
      const fallbackCallback = () => {
        if (hasFired) return;
        hasFired = true;
        setVoiceAndSpeak();
      };
      window.speechSynthesis.onvoiceschanged = fallbackCallback;
      setTimeout(fallbackCallback, 250);
    } else {
      setVoiceAndSpeak();
    }
  }, []);

  const handleSendText = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    
    setLoading(true);
    setOrbState('thinking');
    addMessage('user', text);

    if (offlineMode) {
      const lower = text.toLowerCase();
      const response = Object.entries(OFFLINE_REPLIES).find(([key]) => lower.includes(key))?.[1] || OFFLINE_REPLIES.default;
      setTimeout(() => {
        addMessage('assistant', response);
        speak(response);
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      const response = await ApiService.sendTextCommand(text);
      addMessage('assistant', response);
      speak(response);
    } catch (err) {
      addMessage('system', `❌ Host: Imposible conectar al backend local: ${String(err)}`);
      setOrbState('error');
      setTimeout(() => setOrbState('idle'), 3000);
    } finally {
      setLoading(false);
    }
  }, [loading, offlineMode, addMessage, speak]);

  const handleVisionAnalyze = useCallback(async (base64Image: string, source: 'upload' | 'camera', prompt: string) => {
    setLoading(true);
    setOrbState('thinking');
    addMessage('user', source === 'camera' ? '📸 Analizando entorno en tiempo real...' : '📸 Analizando imagen...');

    try {
      const response = await ApiService.analyzeVision(base64Image, source, prompt);
      addMessage('assistant', response);
      speak(response);
      setOrbState('idle');
    } catch (err) {
      addMessage('system', `❌ Error de visión: ${String(err)}`);
      setOrbState('error');
      setTimeout(() => setOrbState('idle'), 3000);
    } finally {
      setLoading(false);
    }
  }, [addMessage, speak]);

  return {
    messages,
    loading,
    offlineMode,
    orbState,
    speaking,
    setOrbState,
    handleSendText,
    handleVisionAnalyze,
    addMessage
  };
}
