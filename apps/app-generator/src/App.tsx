import React, { useState, useRef, useEffect } from 'react';
import { Send, Code2, MonitorPlay, Sparkles, Loader2, Copy, Check } from 'lucide-react';

/** Pool de API keys con rotación automática ante rate-limits.
 *  Vite requiere acceso literal a import.meta.env.VITE_* para inlining estático. */
const API_KEYS: string[] = [
  import.meta.env.VITE_GEMINI_API_KEY,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4,
  import.meta.env.VITE_GEMINI_API_KEY_5,
  import.meta.env.VITE_GEMINI_API_KEY_6,
  import.meta.env.VITE_GEMINI_API_KEY_7,
  import.meta.env.VITE_GEMINI_API_KEY_8,
  import.meta.env.VITE_GEMINI_API_KEY_9,
  import.meta.env.VITE_GEMINI_API_KEY_10,
  import.meta.env.VITE_GEMINI_API_KEY_11,
  import.meta.env.VITE_GEMINI_API_KEY_12,
  import.meta.env.VITE_GEMINI_API_KEY_13,
  import.meta.env.VITE_GEMINI_API_KEY_14,
  import.meta.env.VITE_GEMINI_API_KEY_15,
  import.meta.env.VITE_GEMINI_API_KEY_16,
  import.meta.env.VITE_GEMINI_API_KEY_17,
].filter((k): k is string => !!k && k !== "REPLACE_ME_SECRETS");


let currentKeyIndex = 0;

/** Devuelve la siguiente key del pool (round-robin). */
function getNextKey(): string {
  if (API_KEYS.length === 0) return "";
  const key = API_KEYS[currentKeyIndex % API_KEYS.length];
  currentKeyIndex++;
  return key;
}

function buildApiUrl(key: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${key}`;
}

const SYSTEM_INSTRUCTION = `Eres MSBross APP Generator, un Ingeniero Frontend Experto.
Tu única misión es crear aplicaciones web 100% funcionales, interactivas y asombrosas a partir de prompts.
REGLAS ESTRICTAS:
1. Devuelve ÚNICAMENTE un único bloque de código markdown de HTML (\`\`\`html ... \`\`\`). No añadas explicaciones, saludos ni comentarios fuera del bloque.
2. El HTML debe contener todo: <style> embebido y <script> embebido.
3. Utiliza CDN de TailwindCSS (<script src="https://cdn.tailwindcss.com"></script>) de forma nativa.
4. Utiliza iconos de FontAwesome o lucide si es necesario.
5. Haz que el diseño sea "Glassmorphism", Premium, con Modo Oscuro de lujo y microinteracciones suaves y neón.
6. El código debe ser 100% capaz de ejecutarse dentro de un Iframe sin dependencias de bundlers locales. Escribe Javascript dentro de <script>.`;

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const extractHTML = (text: string) => {
    const regex = /```(?:html)?\n([\s\S]*?)```/;
    const match = text.match(regex);
    return match ? match[1].trim() : text;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (API_KEYS.length === 0) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ No hay API keys de Gemini configuradas. Contacta al administrador.' }]);
      return;
    }
    
    const userPrompt = input.trim();
    const newMessages: Message[] = [...messages, { role: 'user', content: userPrompt }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const historyContents = newMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const payload = {
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: historyContents,
        generationConfig: { temperature: 0.7 }
      };

      /** Intenta con rotación de keys y backoff exponencial. */
      const doFetch = async (): Promise<any> => {
        const maxAttempts = Math.min(API_KEYS.length * 2, 10);
        for (let i = 0; i < maxAttempts; i++) {
          const key = getNextKey();
          try {
            const response = await fetch(buildApiUrl(key), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (response.ok) return await response.json();
            if (response.status === 429 || response.status === 403) {
              // Rate-limited o key inválida → rotar a la siguiente
              await new Promise(r => setTimeout(r, 1000 * (i + 1)));
              continue;
            }
            throw new Error(`API Error: ${response.status}`);
          } catch (e) {
            if (i === maxAttempts - 1) throw e;
          }
        }
        throw new Error("Todas las keys agotadas");
      };

      const data = await doFetch();
      const botResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!botResponse) throw new Error("Respuesta vacía de Gemini");
      const cleanCode = extractHTML(botResponse);
      setGeneratedCode(cleanCode);
      setActiveTab('preview');
      
      setMessages([...newMessages, { role: 'assistant', content: "¡Aplicación generada con éxito! He desplegado el resultado interactivo en el Sandbox." }]);
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: 'assistant', content: "⚠️ Error generando la aplicación. Se superaron los límites de la API de Gemini. Reinténtalo en unos segundos." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="app-layout" style={{ padding: '20px', gap: '20px', background: 'radial-gradient(circle at 50% 50%, #0a0a1a, #030712)' }}>
      
      {/* 🔴 CONTROL PANEL (Chat) */}
      <div className="panel-sidebar portal-card">
        <div className="portal-card-inner">
        
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent), #f472b6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '1.2rem', margin: 0, letterSpacing: '-0.5px' }}>MSBross App Generator</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>Gemini 2.5 Flash Native</p>
          </div>
        </div>

        {/* Chat History */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '50px', fontSize: '0.9rem' }}>
              <div style={{ background: 'var(--bg-tertiary)', width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                <Code2 size={24} color="var(--accent)" />
              </div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>¿Qué construimos hoy?</p>
              <p style={{ marginTop: '8px', fontSize: '0.8rem' }}>"Crea una calculadora médica de IMC moderna con Tailwind"</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                  {msg.role === 'user' ? 'Tú' : 'MSBross AI'}
                </div>
                <div style={{
                  padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem', lineHeight: 1.5,
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                  maxWidth: '90%', border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                  boxShadow: msg.role === 'user' ? '0 4px 20px var(--accent-glow)' : 'none'
                }}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--border)' }}>
              <Loader2 size={16} className="lucide-spin" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Escribiendo código...</span>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', transition: 'border 0.3s' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe la Web App que deseas..."
              style={{
                flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '8px',
                resize: 'none', minHeight: '50px', maxHeight: '150px', outline: 'none', fontSize: '0.95rem'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                style={{
                  width: 40, height: 40, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: input.trim() ? 'var(--accent)' : 'var(--bg-tertiary)', border: 'none',
                  color: input.trim() ? 'white' : 'var(--text-secondary)', cursor: input.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '10px' }}>
            Presiona Enter para generar · Shift + Enter para salto de línea
          </p>
        </div>
        
        </div>
      </div>

      {/* 🟢 PREVIEW OUTLET (Sandbox & Code) */}
      <div className="panel-preview portal-card">
        <div className="portal-card-inner">
        
        {/* Sandbox Tabs */}
        <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={() => setActiveTab('preview')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px',
                background: activeTab === 'preview' ? 'var(--bg-tertiary)' : 'transparent',
                color: activeTab === 'preview' ? 'white' : 'var(--text-secondary)', border: 'none',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s'
              }}
            >
              <MonitorPlay size={16} /> Sandbox Visual
            </button>
            <button
              onClick={() => setActiveTab('code')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px',
                background: activeTab === 'code' ? 'var(--bg-tertiary)' : 'transparent',
                color: activeTab === 'code' ? 'white' : 'var(--text-secondary)', border: 'none',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s'
              }}
            >
              <Code2 size={16} /> Código Fuente
            </button>
          </div>
          
          {activeTab === 'code' && generatedCode && (
            <button
              onClick={copyToClipboard}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px',
                background: copied ? 'var(--accent)' : 'var(--bg-tertiary)', color: 'white', border: '1px solid var(--border)',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '¡Copiado!' : 'Copiar Raw'}
            </button>
          )}
        </div>

        {/* Viewport content */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {!generatedCode && !isLoading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-secondary)' }}>
              <div style={{ width: 100, height: 100, border: '2px dashed var(--border)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', background: 'var(--bg-primary)' }}>
                <MonitorPlay size={40} opacity={0.3} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Sandbox Vacío</h2>
              <p style={{ marginTop: '10px' }}>Escribe tu prompt para iniciar la construcción.</p>
            </div>
          )}

          {activeTab === 'preview' && generatedCode && (
            <iframe
              title="MSBross App Preview Sandbox"
              srcDoc={generatedCode}
              style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
              sandbox="allow-scripts allow-forms allow-popups allow-modals"
            />
          )}

          {activeTab === 'code' && generatedCode && (
            <div style={{ height: '100%', overflowY: 'auto', padding: '20px', background: '#1e1e1e' }}>
              <pre style={{ margin: 0, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem', color: '#d4d4d4', whiteSpace: 'pre-wrap' }}>
                <code>{generatedCode}</code>
              </pre>
            </div>
          )}
        </div>
        
        </div>
      </div>
    </div>
  );
}
