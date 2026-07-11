import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: Props) {
  const [keys, setKeys] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('msbross_assistant_custom_keys');
      if (stored) setKeys(JSON.parse(stored));
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('msbross_assistant_custom_keys', JSON.stringify(keys));
    onClose();
    window.location.reload();
  };

  const providers = ['openai', 'anthropic', 'gemini', 'groq', 'openrouter'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#161a22] border border-[#2d3342] w-full max-w-md rounded-2xl p-6 shadow-2xl"
        >
          <h2 className="text-xl font-bold text-white mb-2">Configuración de APIs</h2>
          <p className="text-sm text-white/60 mb-6">
            Configura tus propias API keys para usar otros modelos. Se guardan localmente en tu navegador.
          </p>
          
          <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
            {providers.map(prov => (
              <div key={prov} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#ffcc00] uppercase tracking-wider">{prov}</label>
                <input
                  type="password"
                  value={keys[prov] || ''}
                  onChange={e => setKeys({ ...keys, [prov]: e.target.value })}
                  placeholder="API Key..."
                  className="bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00ffcc] transition-colors"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button 
              onClick={onClose} 
              className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              className="px-4 py-2 rounded-lg text-sm font-bold bg-[#00ffcc] text-black hover:bg-[#00e6b8] transition-colors shadow-[0_0_15px_rgba(0,255,204,0.3)]"
            >
              Guardar y Recargar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
