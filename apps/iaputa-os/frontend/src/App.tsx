import React, { useState, useEffect, useCallback, useRef } from 'react';
import NeuralOrb from './components/NeuralOrb';
import './index.css';

/**
 * API base URL: auto-detect production (msbross.me → PHP gateway) vs local (FastAPI)
 */
const isProduction = window.location.hostname === 'msbross.me';
const API_BASE = isProduction
  ? '/_iaputa/api'
  : ((import.meta as any).env.VITE_API_BASE_URL || `http://${window.location.hostname}:8006/api`);
const API_KEY = (import.meta as any).env.VITE_API_KEY || '';
const USE_PHP_GATEWAY = false;

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

const OFFLINE_REPLIES: Record<string, string> = {
  hola: '¡Hola! Soy IAPuta OS, tu asistente IA personal de élite. ¿En qué puedo ayudarte hoy?',
  hello: 'Hello! I am IAPuta OS, your luxury AI assistant. How can I act for you?',
  ayuda: 'Tengo acceso a:\n• 📷 Análisis de visión y pantalla\n• 🌐 Búsquedas avanzadas\n• 💻 Shell y manipulación local\n• 🧠 Multi-LLM en fallback (Groq → Ollama → OpenRouter)',
  default: 'Entendido. El backend local no está accesible en este momento. Por favor levanta la API de FastAPI para funcionalidad completa.',
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [orbState, setOrbState] = useState<'idle' | 'listening' | 'thinking' | 'speaking' | 'error'>('idle');
  const [volume, setVolume] = useState(0);
  const [visionModeActive, setVisionModeActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const statusUrl = USE_PHP_GATEWAY ? `${API_BASE}status` : `${API_BASE}/status`;
    fetch(statusUrl, { signal: AbortSignal.timeout(3000) })
      .then(r => { if (!r.ok) setOfflineMode(true); })
      .catch(() => setOfflineMode(true));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_`~]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      const setVoiceAndSpeak = () => {
        let voices = window.speechSynthesis.getVoices();
        let bestVoice = voices.find(v => v.name === 'Google español')
                     || voices.find(v => v.lang.startsWith('es') && v.name.includes('Premium'))
                     || voices.find(v => v.lang.startsWith('es') && (v.name.includes('Monica') || v.name.includes('Jorge') || v.name.includes('Diego')))
                     || voices.find(v => v.lang.startsWith('es-ES'))
                     || voices.find(v => v.lang.startsWith('es'));
                     
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
        
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
        // Fallback timeout in case onvoiceschanged never fires
        setTimeout(fallbackCallback, 250);
      } else {
        setVoiceAndSpeak();
      }
    }
  }, []);

  const startRecording = useCallback(() => {
    // We use Web Speech API (WebRTC Google) to directly listen to text.
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: '❌ Web Speech API no soportada en este navegador.', timestamp: new Date() }]);
      return;
    }
    
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setRecording(true);
        setOrbState('listening');
      };
      
      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setRecording(false);
        setOrbState('thinking');
        
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: `🎤 ${transcript}`, timestamp: new Date() }]);
        
        try {
          const res = await fetch(`${API_BASE}/text-command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
            body: JSON.stringify({ text: transcript }),
          });
          const data = await res.json();
          const assistantContent = data.response || data.transcript || 'Sin respuesta';
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: assistantContent,
            timestamp: new Date()
          }]);
          
          // FORCE NEURAL BRIDGE (Level 3 Orchestration)
          const lowerAssistant = assistantContent.toLowerCase();
          if (lowerAssistant.includes('creando tarea') || lowerAssistant.includes('tarea creada') || lowerAssistant.includes('anotado en taskflow')) {
            fetch(`${API_BASE}vault-update`, {
              method: 'POST',
              body: JSON.stringify({ 
                notification: { type: 'TASK', content: `Nueva tarea desde IAPuta: ${transcript.slice(0,30)}...` },
                app: 'taskflow',
                data: { last_sync: Date.now() }
              })
            }).catch(() => {});
          }

          if (lowerAssistant.includes('temporizador') || lowerAssistant.includes('minutos en industrialpro')) {
              fetch(`${API_BASE}vault-update`, {
                method: 'POST',
                body: JSON.stringify({ 
                  notification: { type: 'TIMER', content: `Timer iniciado desde IAPuta` },
                  app: 'industrialpro',
                  data: { timer_active: true }
                })
              }).catch(() => {});
          }

          speak(assistantContent);
        } catch (err) {
          setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `❌ Error de conexión: ${String(err)}`, timestamp: new Date() }]);
          setOrbState('error');
          setTimeout(() => setOrbState('idle'), 3000);
        }
      };
      
      recognition.onerror = () => {
        setRecording(false);
        setOrbState('error');
        setTimeout(() => setOrbState('idle'), 3000);
      };
      
      recognition.onend = () => {
        setRecording(false);
        setOrbState(prev => prev === 'listening' ? 'idle' : prev); // Reset if user didn't speak
      };

      recognition.start();
      
      mediaRecorderRef.current = recognition as any; // Hack to store recognition instance so stopRecording works
    } catch (err) {
      setOrbState('error');
      setTimeout(() => setOrbState('idle'), 3000);
    }
  }, [speak]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current as any).stop) {
      (mediaRecorderRef.current as any).stop();
      setRecording(false);
    }
  }, []);

  const sendText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setOrbState('thinking');
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() }]);

    if (offlineMode) {
      const lower = text.toLowerCase();
      let response = OFFLINE_REPLIES.default;
      for (const [key, value] of Object.entries(OFFLINE_REPLIES)) {
        if (lower.includes(key)) { response = value; break; }
      }
      setTimeout(() => {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: response, timestamp: new Date() }]);
        speak(response);
        setLoading(false);
      }, 1000);
    } else {
      try {
        const res = await fetch(`${API_BASE}/text-command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        const assistantContent = data.response || data.error || 'Sin respuesta';
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date()
        }]);
        
        // FORCE NEURAL BRIDGE (Level 3 Orchestration)
        const lowerAssistant = assistantContent.toLowerCase();
        if (lowerAssistant.includes('creando tarea') || lowerAssistant.includes('tarea creada') || lowerAssistant.includes('anotado en taskflow')) {
          fetch(`${API_BASE}vault-update`, {
            method: 'POST',
            body: JSON.stringify({ 
              notification: { type: 'TASK', content: `Nueva tarea desde IAPuta: ${text.slice(0,30)}...` },
              app: 'taskflow',
              data: { last_sync: Date.now() }
            })
          }).catch(() => {});
        }
        
        if (lowerAssistant.includes('temporizador') || lowerAssistant.includes('minutos en industrialpro')) {
            fetch(`${API_BASE}vault-update`, {
              method: 'POST',
              body: JSON.stringify({ 
                notification: { type: 'TIMER', content: `Timer iniciado desde IAPuta` },
                app: 'industrialpro',
                data: { timer_active: true }
              })
            }).catch(() => {});
        }

        speak(assistantContent);
      } catch (err) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `❌ Host: Imposible conectar al backend local: ${String(err)}`, timestamp: new Date() }]);
        setOrbState('error');
        setTimeout(() => setOrbState('idle'), 3000);
      }
      setLoading(false);
    }
  }, [offlineMode, speak]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) { sendText(input); setInput(''); }
  };

  const handleVisionUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setOrbState('thinking');
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: '📸 Analizando imagen...', timestamp: new Date() }]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Image = e.target?.result as string;
      
      try {
        const res = await fetch(`${API_BASE}/vision-analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
          body: JSON.stringify({ 
            image: base64Image,
            source: 'upload',
            prompt: 'Describe detalladamente lo que ves en esta imagen. Sé concisa pero directa.'
          }),
        });
        const data = await res.json();
        const assistantContent = data.response || data.error || 'Sin respuesta';
        
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date()
        }]);
        
        speak(assistantContent);
      } catch (err) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `❌ Error de visión: ${String(err)}`, timestamp: new Date() }]);
        setOrbState('error');
        setTimeout(() => setOrbState('idle'), 3000);
      }
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const startVisionMode = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setVisionModeActive(true);
    } catch (err: any) {
      if (err.name === 'OverconstrainedError' || err.name === 'NotFoundError') {
        try {
          // Fallback to any available camera if environment camera fails
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(fallbackStream);
          setVisionModeActive(true);
          return;
        } catch (fallbackErr: any) {
          err = fallbackErr;
        }
      }
      
      let errorMsg = String(err);
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Permiso denegado. Por favor, habilita el acceso a la cámara en la configuración de tu navegador (el candado en la barra de direcciones) o en los ajustes de privacidad de tu sistema operativo.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No se encontró ninguna cámara conectada al dispositivo.';
      }

      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `❌ Error al acceder a la cámara: ${errorMsg}`, timestamp: new Date() }]);
    }
  };

  useEffect(() => {
    if (visionModeActive && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [visionModeActive, stream]);

  const stopVisionMode = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setVisionModeActive(false);
  };

  const captureVisionFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
    
    stopVisionMode();
    
    setLoading(true);
    setOrbState('thinking');
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: '📸 Analizando entorno en tiempo real...', timestamp: new Date() }]);

    fetch(`${API_BASE}/vision-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({ 
        image: base64Image,
        source: 'camera',
        prompt: 'Analiza detalladamente lo que capturó la cámara y descríbelo de forma útil, como un asistente de inteligencia artificial.'
      }),
    })
    .then(res => res.json())
    .then(data => {
      const assistantContent = data.response || data.error || 'Sin respuesta';
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      }]);
      speak(assistantContent);
      setLoading(false);
      setOrbState('idle');
    })
    .catch(err => {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `❌ Error de visión en tiempo real: ${String(err)}`, timestamp: new Date() }]);
      setOrbState('error');
      setTimeout(() => setOrbState('idle'), 3000);
      setLoading(false);
    });
  };

  return (
    <div className="app-container">
      {visionModeActive && (
        <div className="vision-mode-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: '80%', objectFit: 'contain' }}></video>
          <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <button type="button" onClick={stopVisionMode} style={{ padding: '15px 30px', borderRadius: '30px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', fontSize: '18px' }}>❌ Cancelar</button>
            <button type="button" onClick={captureVisionFrame} style={{ padding: '15px 30px', borderRadius: '30px', background: '#3b82f6', color: 'white', border: 'none', fontSize: '18px', fontWeight: 'bold' }}>📸 Capturar y Analizar</button>
          </div>
        </div>
      )}

      {/* Background with Noise */}
      <div className="noise-overlay"></div>
      
      {/* Background Neural Orb fills the viewport contextually */}
      <div className="spatial-orb-layer">
        <div className="glow-backdrop"></div>
        <NeuralOrb state={orbState} volume={volume} />
      </div>

      {/* Main Spatial UI Layer */}
      <div className="spatial-ui-layer">
        
        {/* Sleek Top Bar */}
        <header className="sleek-header">
          <div className="header-content">
            <div className="brand-group">
              <div className="brand-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.1 7.1"/><path d="M12 12l9.9 4.9"/></svg>
              </div>
              <h1 className="brand-title">IAPUTA OS</h1>
              <div className="version-tag">v10</div>
            </div>
            <div className={`status-indicator ${offlineMode ? 'offline' : 'online'}`}>
              <div className="status-dot"></div>
              <span>{offlineMode ? 'Host Only' : 'Host + Local'}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Chat Area */}
        <main className="sleek-chat-area">
          <div className="chat-container-inner">
            {messages.length === 0 ? (
              <div className="sleek-empty-state">
                <div className="empty-graphic">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </div>
                <h2>System Ready</h2>
                <p>Neural core is synchronized. Awaiting directives.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`message-row message-row--${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.1 7.1"/><path d="M12 12l9.9 4.9"/></svg>
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-text">
                      {msg.content.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="message-row message-row--assistant">
                 <div className="message-avatar">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.1 7.1"/><path d="M12 12l9.9 4.9"/></svg>
                 </div>
                 <div className="message-content">
                    <div className="loader-pulse"></div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} className="scroll-anchor" />
          </div>
        </main>

        {/* Floating Bottom Dock */}
        <footer className="sleek-dock-container">
          <div className="portal-card" style={{ width: '100%', maxWidth: 800, pointerEvents: 'auto' }}>
          <form className="portal-card-inner sleek-input-dock" onSubmit={handleSubmit} style={{ background: 'rgba(10,10,10,0.85)' }}>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleVisionUpload} 
            />
            
            <button type="button" className="action-btn" onClick={() => fileInputRef.current?.click()} title="Upload Image">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
            <button type="button" className="action-btn" onClick={startVisionMode} title="Live Vision">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>

            <input 
              type="text" 
              placeholder="Ask IAPuta OS or inject commands..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              disabled={loading}
              className="sleek-input"
            />
            
            <button type="button" className={`action-btn mic-btn ${recording ? 'recording' : ''}`} onClick={recording ? stopRecording : startRecording} title="Voice Command">
              {recording ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              )}
            </button>

            {input.trim() && !loading && (
              <button type="submit" className="action-btn submit-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            )}
          </form>
          </div>
          <div className="dock-footer-text">IAPuta OS Multi-LLM Environment. Output may vary.</div>
        </footer>
      </div>
    </div>
  );
}
