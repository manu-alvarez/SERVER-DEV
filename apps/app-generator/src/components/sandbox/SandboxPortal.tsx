import React, { useState, useMemo } from 'react';
import { MonitorPlay, Code2, Copy, Check } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useGeminiApi } from '../../hooks/useGeminiApi';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const extractHTML = (text: string) => {
  const regex = /```(?:html)?\n([\s\S]*?)```/;
  const match = text.match(regex);
  return match ? match[1].trim() : text;
};

export const SandboxPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  
  const { messages } = useChatStore();
  const { isPending } = useGeminiApi();

  // Get the last assistant message that contains HTML
  const generatedCode = useMemo(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    if (assistantMessages.length === 0) return null;
    const lastMsg = assistantMessages[assistantMessages.length - 1].content;
    return extractHTML(lastMsg);
  }, [messages]);

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="panel-preview portal-card h-full">
      <div className="portal-card-inner flex flex-col h-full bg-black/40 backdrop-blur-3xl border border-white/5 shadow-2xl">
        
        {/* Sandbox Tabs */}
        <div className="h-[60px] shrink-0 flex items-center justify-between px-5 border-b border-white/5 bg-black/20">
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('preview')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300",
                activeTab === 'preview' ? "bg-white/10 text-white shadow-md" : "text-slate-400 hover:text-white"
              )}
            >
              <MonitorPlay size={16} /> Sandbox
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300",
                activeTab === 'code' ? "bg-white/10 text-white shadow-md" : "text-slate-400 hover:text-white"
              )}
            >
              <Code2 size={16} /> Raw Code
            </button>
          </div>
          
          {activeTab === 'code' && generatedCode && (
            <button
              onClick={copyToClipboard}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border",
                copied 
                  ? "bg-fuchsia-500 text-white border-fuchsia-400 shadow-[0_0_15px_rgba(244,114,182,0.4)]" 
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
              )}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '¡COPIADO!' : 'COPIAR RAW'}
            </button>
          )}
        </div>

        {/* Viewport content */}
        <div className="flex-1 relative overflow-hidden bg-white">
          {!generatedCode && !isPending && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-[#030712]">
              <div className="w-24 h-24 border-2 border-dashed border-white/10 rounded-3xl flex items-center justify-center mb-6 bg-white/5">
                <MonitorPlay size={40} className="opacity-30" />
              </div>
              <h2 className="text-2xl font-black text-slate-200 tracking-tight">Sandbox Vacío</h2>
              <p className="mt-2 text-sm">El motor cuántico espera tus instrucciones.</p>
            </div>
          )}
          
          {!generatedCode && isPending && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-[#030712]">
             <div className="w-24 h-24 border border-fuchsia-500/30 rounded-3xl flex items-center justify-center mb-6 bg-fuchsia-500/5 shadow-[0_0_30px_rgba(244,114,182,0.2)]">
               <div className="animate-pulse flex items-center justify-center w-full h-full">
                 <MonitorPlay size={40} className="text-fuchsia-400 opacity-80" />
               </div>
             </div>
             <h2 className="text-xl font-bold text-fuchsia-400 tracking-tight animate-pulse">Sintetizando UI...</h2>
           </div>
          )}

          {activeTab === 'preview' && generatedCode && (
            <iframe
              title="MSBross App Preview Sandbox"
              srcDoc={generatedCode}
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts allow-forms allow-popups allow-modals"
            />
          )}

          {activeTab === 'code' && generatedCode && (
            <div className="h-full overflow-y-auto p-5 bg-[#0d1117]">
              <pre className="m-0 font-mono text-[13px] leading-relaxed text-[#c9d1d9] whitespace-pre-wrap">
                <code>{generatedCode}</code>
              </pre>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};
