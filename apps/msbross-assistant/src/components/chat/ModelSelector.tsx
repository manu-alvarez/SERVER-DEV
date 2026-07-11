import { useModels } from '../../hooks/useModels';
import { useChatStore } from '../../store/useChatStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

/**
 * Model selection dropdown.
 */
export function ModelSelector() {
  const { data: models = [], isLoading } = useModels();
  const { selectedModel, setSelectedModel } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = models.find(m => m.id === selectedModel) || models[0];

  // Group models by provider
  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, typeof models>);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00ffcc]" />
          <span>{currentModel?.name || 'Seleccionando...'}</span>
        </div>
        <ChevronDown className="w-4 h-4 opacity-50" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-[calc(100%+8px)] left-0 w-full z-[9999] bg-[#161a22]/95 backdrop-blur-xl border border-[#2d3342] rounded-2xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            {isLoading ? (
              <div className="p-4 text-center text-white/50 text-sm">Cargando modelos...</div>
            ) : (
              <div className="max-h-80 overflow-y-auto custom-scrollbar pr-1">
                {Object.entries(groupedModels).map(([provider, providerModels]) => (
                  <div key={provider} className="mb-4 last:mb-0">
                    <div className="text-[10px] uppercase tracking-widest text-[#ffcc00] font-bold px-3 mb-2 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#ffcc00]"></span>
                      {provider}
                    </div>
                    <div className="space-y-1">
                      {providerModels.map(model => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setIsOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center justify-between
                            ${selectedModel === model.id 
                              ? 'bg-[#00ffcc]/10 text-[#00ffcc] font-medium' 
                              : 'text-white/70 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            {model.name}
                            {model.free && (
                              <span className="px-1.5 py-0.5 rounded-md bg-[#00ffcc]/10 text-[#00ffcc] text-[9px] uppercase tracking-wider font-bold">
                                Free
                              </span>
                            )}
                          </div>
                          {selectedModel === model.id && (
                            <motion.div layoutId="active-model-indicator" className="w-1.5 h-1.5 rounded-full bg-[#00ffcc]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
