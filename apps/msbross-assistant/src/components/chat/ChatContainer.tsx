import { useRef, useEffect, useState } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useChatStream } from '../../hooks/useChatStream';
import { HeroCards } from './HeroCards';
import { MessageBubble } from './MessageBubble';
import { Button } from '../ui/Button';
import { Send, Loader2, X as XIcon, Mic } from 'lucide-react';
import { Orb } from 'orb-ui';

export function ChatContainer() {
  const { messages, isGenerating, attachments, setAttachments, clearAttachments } = useChatStore();
  const { sendMessage } = useChatStream();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput((prev) => prev + (prev.length > 0 ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0 || isGenerating) return;
    sendMessage(input, attachments);
    setInput('');
    clearAttachments();
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1115] relative overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {messages.length === 0 ? (
          <div className="min-h-full w-full flex flex-col items-center md:justify-center pt-10 pb-40">
            <HeroCards />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full pb-32">
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f1115] via-[#0f1115] to-transparent z-50">
        <div className="max-w-4xl mx-auto">
          
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#00ffcc]/10 border border-[#00ffcc]/30 text-[#00ffcc] px-3 py-1.5 rounded-xl text-xs backdrop-blur-md shadow-lg">
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button type="button" onClick={() => removeAttachment(i)} className="hover:text-white transition-colors">
                     <XIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form 
            onSubmit={handleSubmit}
            className="flex gap-2 bg-[#161a22] border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl"
          >
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            <div className="flex items-center gap-2 px-2">
              <Button variant="ghost" size="icon" className="text-white/40 hover:text-[#00ffcc] hover:bg-[#00ffcc]/10 rounded-full transition-all" type="button" onClick={() => fileInputRef.current?.click()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </Button>
            </div>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Escuchando... Habla ahora." : "Habla directamente con Adele..."}
              className="flex-1 min-w-0 w-full bg-transparent border-none text-white px-2 py-3 md:py-4 focus:outline-none placeholder:text-white/30 font-medium text-base md:text-lg"
              disabled={isGenerating}
            />
            
            <div className="flex items-center gap-2 pr-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`rounded-full transition-all mr-1 ${isListening ? 'text-red-400 bg-red-400/20 animate-pulse' : 'text-white/40 hover:text-[#aa3bff] hover:bg-[#aa3bff]/10'}`} 
                type="button" 
                onClick={toggleListening}
              >
                <Mic className="w-5 h-5" />
              </Button>
              <Button 
                type="submit" 
                size="icon" 
                variant="glass" 
                disabled={(!input.trim() && attachments.length === 0) || isGenerating}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00ffcc] to-[#00b38f] text-black shadow-[0_0_20px_rgba(0,255,204,0.4)] hover:shadow-[0_0_30px_rgba(0,255,204,0.6)] hover:scale-105 transition-all border-none disabled:opacity-50 disabled:hover:scale-100"
              >
                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
              </Button>
            </div>
          </form>
          <div className="flex items-center justify-center gap-3 mt-2">
            <Orb
              state={isGenerating ? 'thinking' : isListening ? 'listening' : 'idle'}
              theme="circle"
              size={24}
              disabled
              aria-label="System status indicator"
            />
            <span className="text-[10px] text-white/30 uppercase tracking-widest">
              MSBrOSs GODMODE LEVEL 99 // {isGenerating ? 'GENERANDO...' : isListening ? 'ESCUCHANDO...' : 'SISTEMA EN LÍNEA'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
