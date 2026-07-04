import React, { useState, useRef, useEffect } from 'react';
import { Send, Code2, Sparkles, Loader2 } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useGeminiApi } from '../../hooks/useGeminiApi';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// Shadcn-like utility
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const ChatPanel: React.FC = () => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages } = useChatStore();
  const { mutate: generateApp, isPending } = useGeminiApi();

  const handleSend = () => {
    if (!input.trim() || isPending) return;
    generateApp(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  return (
    <div className="panel-sidebar portal-card h-full">
      <div className="portal-card-inner flex flex-col h-full bg-black/40 backdrop-blur-3xl border border-white/5 shadow-2xl">
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(244,114,182,0.4)]">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-white m-0 leading-tight">MSBross AppGen</h1>
            <p className="text-xs text-fuchsia-400 font-bold uppercase tracking-wider">Motor de Generación</p>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 mt-12 text-sm flex flex-col items-center">
              <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Code2 size={28} className="text-fuchsia-400" />
              </div>
              <p className="font-bold text-slate-200 text-base">¿Qué construimos hoy?</p>
              <p className="mt-2 text-xs opacity-70">"Crea una calculadora médica con Tailwind"</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex flex-col max-w-[85%]", msg.role === 'user' ? 'self-end items-end' : 'self-start items-start')}
                >
                  <div className="text-[10px] text-slate-500 mb-1 uppercase font-bold tracking-wider">
                    {msg.role === 'user' ? 'Tú' : 'MSBross AI'}
                  </div>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? 'bg-fuchsia-500 text-white shadow-[0_4px_20px_rgba(244,114,182,0.3)] rounded-tr-sm' 
                      : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-sm'
                  )}>
                    {msg.role === 'user' ? msg.content : (
                      // Simple regex to just show the assistant message text without the massive code block in chat
                      // Or we can just say "Aplicación generada en el Sandbox"
                      msg.content.includes('```html') 
                        ? '🚀 Aplicación generada con éxito. Revisa el Sandbox Visual.'
                        : msg.content
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-xl w-fit border border-white/5">
              <Loader2 size={16} className="animate-spin text-fuchsia-400" />
              <span className="text-xs text-slate-400 font-medium">Sintetizando código cuántico...</span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-5 border-t border-white/5 bg-black/20 shrink-0">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-2 transition-colors focus-within:border-fuchsia-500/50 focus-within:bg-white/10">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe la Web App de tus sueños..."
              className="flex-1 bg-transparent border-none text-white p-2 resize-none min-h-[50px] max-h-[150px] outline-none text-sm placeholder:text-slate-500"
            />
            <div className="flex items-end pb-1">
              <button 
                onClick={handleSend}
                disabled={isPending || !input.trim()}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                  input.trim() && !isPending
                    ? "bg-fuchsia-500 text-white shadow-[0_0_15px_rgba(244,114,182,0.4)] hover:bg-fuchsia-400 hover:scale-105"
                    : "bg-white/5 text-slate-500 cursor-not-allowed"
                )}
              >
                <Send size={18} className={cn(input.trim() && !isPending && "translate-x-[2px] -translate-y-[2px]")} />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-3 font-medium">
            Presiona <kbd className="bg-white/10 px-1 py-0.5 rounded">Enter</kbd> para generar · <kbd className="bg-white/10 px-1 py-0.5 rounded">Shift + Enter</kbd> para salto
          </p>
        </div>
        
      </div>
    </div>
  );
};
