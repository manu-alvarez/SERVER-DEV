import { useModels } from '../../hooks/useModels';
import { useChatStore } from '../../store/useChatStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Model selection dropdown.
 * Uses a React portal to render the dropdown outside any overflow-hidden container,
 * preventing clipping on mobile devices.
 */
export function ModelSelector() {
  const { data: models = [], isLoading } = useModels();
  const { selectedModel, setSelectedModel } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
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
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Calculate position for the portal dropdown
  const getDropdownStyle = (): React.CSSProperties => {
    if (!triggerRef.current) return {};
    const rect = triggerRef.current.getBoundingClientRect();
    return {
      position: 'fixed',
      top: rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, 320),
      maxWidth: 'calc(100vw - 16px)',
      zIndex: 9999,
    };
  };

  return (
    <>
      <button 
        ref={triggerRef}
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
        {isOpen && createPortal(
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={getDropdownStyle()}
            className="bg-[#161a22]/95 backdrop-blur-xl border border-[#2d3342] rounded-2xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
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
                            ${selectedModel === model.id ? 'bg-[#00ffcc]/10 text-[#00ffcc]' : 'text-white/70 hover:bg-white/5 hover:text-white'}
                          `}
                        >
                          <span>{model.name}</span>
                          {model.free && (
                            <span className="text-[9px] uppercase tracking-wider text-[#ffcc00] bg-[#ffcc00]/10 px-2 py-0.5 rounded-full border border-[#ffcc00]/20">
                              + gratis
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </>
  );
}
