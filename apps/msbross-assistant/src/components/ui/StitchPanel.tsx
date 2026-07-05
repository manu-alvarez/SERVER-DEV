import { motion } from 'framer-motion';
import { useChatStore } from '../../store/useChatStore';
import { X, Code2, Copy, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export function StitchPanel() {
  const { stitch, setStitch } = useChatStore();
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (stitch.language === 'html' || stitch.language === 'javascript' || stitch.language === 'css') {
      const timeout = setTimeout(() => {
        if (iframeRef.current) {
          const doc = iframeRef.current.contentDocument;
          if (doc) {
            doc.open();
            doc.write(stitch.content);
            doc.close();
          }
        }
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [stitch.content, stitch.language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(stitch.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!stitch.isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, width: 0 }}
      animate={{ opacity: 1, x: 0, width: '50%' }}
      exit={{ opacity: 0, x: 20, width: 0 }}
      className="hidden lg:flex flex-col h-full border-l border-white/10 bg-[#0f1115]/95 backdrop-blur-3xl z-20 overflow-hidden shadow-[-20px_0_50px_rgba(0,0,0,0.5)] relative"
    >
      {/* Subtle Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ffcc]/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#aa3bff]/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 bg-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00ffcc]/10 flex items-center justify-center border border-[#00ffcc]/20">
            <Code2 className="w-4 h-4 text-[#00ffcc]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">STITCH</h3>
            <p className="text-[10px] text-[#00ffcc] uppercase tracking-wider font-mono">Render Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            title="Copiar Código"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          
          <div className="w-px h-4 bg-white/10 mx-1"></div>
          
          <button
            onClick={() => setStitch({ isOpen: false })}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 hover:text-red-400 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative z-10 flex flex-col p-4 gap-4">
        
        {/* Render Preview (if applicable) */}
        {(stitch.language === 'html' || stitch.language === 'javascript' || stitch.language === 'css') ? (
          <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-inner border border-white/20">
            <iframe
              ref={iframeRef}
              title="Stitch Preview"
              sandbox="allow-scripts allow-modals allow-forms allow-popups"
              className="w-full h-full bg-white"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
            Vista previa no disponible para {stitch.language}. Mostrando código fuente...
          </div>
        )}

        {/* Source Code View */}
        <div className="h-1/3 bg-[#0a0c10] border border-white/10 rounded-2xl p-4 overflow-auto custom-scrollbar relative group">
          <div className="absolute top-2 right-4 text-[10px] uppercase tracking-wider text-white/30 font-mono">
            {stitch.language}
          </div>
          <pre className="text-xs text-white/80 font-mono leading-relaxed">
            <code>{stitch.content}</code>
          </pre>
        </div>
      </div>
    </motion.div>
  );
}
