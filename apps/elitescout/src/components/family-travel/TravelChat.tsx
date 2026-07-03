'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTravelStore } from '@/hooks/useTravelStore'


interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `Eres un asistente de viajes experto para la familia formada por Manu, Arantxa y su hija Edelweiss (3.5 años).
Viven en Mequinenza (Zaragoza, España) y viajan en coche (hasta 400km), avión (desde ZAZ/REU/BCN) o tren.
Recomiendas destinos familiares, con cuna, parques infantiles, piscinas y menús infantiles.
Responde en español, sé breve, amable y práctico. Menciona precios orientativos.`

export function TravelChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola familia! 🦋 Soy tu asistente de viajes. ¿Qué destino te gustaría explorar? Puedo ayudarte con recomendaciones para Manu, Arantxa y Edelweiss.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/app/elitescout/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.slice(-8),
            userMsg,
          ],
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `HTTP ${res.status}`);
      }
      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content || 'No hubo respuesta.'
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setMessages((prev) => [
        ...prev,
        { role: 'assistant' as const, content: `😅 Ups: ${msg}. Inténtalo de nuevo.` },
      ])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Chat button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl text-2xl flex items-center justify-center cursor-pointer border-none transition-transform hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)',
          boxShadow: '0 4px 20px rgba(255,107,107,0.4)',
        }}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: 'rgba(10,10,10,0.95)',
              border: '1px solid rgba(255,107,107,0.2)',
              backdropFilter: 'blur(20px)',
              maxHeight: '500px',
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center gap-2" style={{
              background: 'linear-gradient(135deg, rgba(255,107,107,0.15), rgba(78,205,196,0.1))',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span className="text-lg">🦋</span>
              <div>
                <div className="text-sm font-bold text-foreground">Asistente Familiar</div>
                <div className="text-[9px] text-text-muted font-mono">Groq IA · Recomendaciones</div>
              </div>
            </div>

            {/* Messages */}
            <div className="p-3 space-y-3 overflow-y-auto" style={{ maxHeight: 340 }}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'rounded-br-sm'
                        : 'rounded-bl-sm'
                    }`}
                    style={{
                      background: m.role === 'user'
                        ? 'rgba(255,107,107,0.15)'
                        : 'rgba(78,205,196,0.1)',
                      border: `1px solid ${m.role === 'user' ? 'rgba(255,107,107,0.2)' : 'rgba(78,205,196,0.15)'}`,
                      color: '#e2e8f0',
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-xl px-3 py-2 text-xs" style={{
                    background: 'rgba(78,205,196,0.1)',
                    border: '1px solid rgba(78,205,196,0.15)',
                  }}>
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/[0.06]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, 500))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ej: ¿Qué ver en Salou?"
                  maxLength={500}
                  aria-label="Mensaje para el asistente de viajes"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono focus:border-gold/30 outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  aria-label="Enviar mensaje"
                  className="px-3 rounded-xl text-sm disabled:opacity-30 cursor-pointer border-none transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)',
                  }}
                >
                  ➤
                </button>
              </div>
              <div className="flex justify-between mt-1 px-1">
                <span className="text-[8px] text-text-muted font-mono">Groq Llama 3.3 · Recomendaciones IA</span>
                <span className="text-[8px] font-mono" style={{ color: input.length > 450 ? '#FF6B6B' : '#666' }}>
                  {input.length}/500
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
