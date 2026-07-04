import React from 'react';
import { motion } from 'framer-motion';
import { useTaskStore, playNotificationSound } from '../store/taskStore';
import { Smartphone, BellRing } from 'lucide-react';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useTaskStore();

  const handleSave = () => {
    alert('Configuración de WhatsApp guardada correctamente en su dispositivo.');
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full pb-20">
      <h2 className="text-4xl font-display font-black text-gradient mb-8">Ajustes</h2>

      {/* Sound Settings */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4 }}
        className="portal-card mb-6"
      >
        <div className="portal-card-inner p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-brand-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <BellRing size={24} />
            </div>
            <h3 className="text-2xl font-display font-black tracking-tight">Experiencia Sensorial</h3>
          </div>
          
          <label className="flex items-center gap-4 cursor-pointer w-max">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={settings.soundEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  updateSettings({ soundEnabled: enabled });
                  if (enabled) playNotificationSound();
                }}
              />
              <div className={`block w-14 h-8 rounded-full transition-colors ${settings.soundEnabled ? 'bg-brand-500' : 'bg-white/10 border border-white/20'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.soundEnabled ? 'translate-x-6 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : ''}`}></div>
            </div>
            <span className="font-bold text-lg text-white/90">Efectos de Sonido</span>
          </label>
        </div>
      </motion.div>

      {/* WhatsApp Settings */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, delay: 0.1 }}
        className="portal-card"
      >
        <div className="portal-card-inner p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-accent-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.5)]">
              <Smartphone size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-display font-black tracking-tight">WhatsApp & CallMeBot</h3>
              <p className="text-muted-foreground font-semibold">Recibe notificaciones en tu móvil</p>
            </div>
          </div>

          <label className="flex items-center gap-4 cursor-pointer w-max mb-8">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={settings.whatsappEnabled}
                onChange={(e) => updateSettings({ whatsappEnabled: e.target.checked })}
              />
              <div className={`block w-14 h-8 rounded-full transition-colors ${settings.whatsappEnabled ? 'bg-accent-500' : 'bg-white/10 border border-white/20'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.whatsappEnabled ? 'translate-x-6 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : ''}`}></div>
            </div>
            <span className="font-bold text-lg text-white/90">Activar Conexión CallMeBot</span>
          </label>

          {settings.whatsappEnabled && (
            <div className="md:pl-6 md:border-l-2 md:border-accent-500/30 flex flex-col gap-6">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-sm font-semibold text-yellow-400">
                  ⚠️ Importante: Los teléfonos deben llevar el prefijo +34, seguidos del número sin ningún espacio (Ej: +34651352065).
                </p>
              </div>

              {/* Usuario 1 */}
              <div className="flex flex-col gap-3">
                <h4 className="text-brand-400 font-bold uppercase tracking-wide text-xs">Usuario Principal</h4>
                <div className="flex flex-col md:flex-row gap-4">
                  <input 
                    type="text" 
                    placeholder="Teléfono (+34 sin espacios)" 
                    value={settings.whatsappPhone1}
                    onChange={(e) => updateSettings({ whatsappPhone1: e.target.value })}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-400 transition-colors font-medium"
                  />
                  <input 
                    type="password" 
                    placeholder="API Key de CallMeBot" 
                    value={settings.whatsappApiKey1}
                    onChange={(e) => updateSettings({ whatsappApiKey1: e.target.value })}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-400 transition-colors font-medium"
                  />
                </div>
              </div>

              {/* Usuario 2 */}
              <div className="flex flex-col gap-3">
                <h4 className="text-accent-400 font-bold uppercase tracking-wide text-xs">Usuario Secundario</h4>
                <div className="flex flex-col md:flex-row gap-4">
                  <input 
                    type="text" 
                    placeholder="Teléfono (+34 sin espacios)" 
                    value={settings.whatsappPhone2}
                    onChange={(e) => updateSettings({ whatsappPhone2: e.target.value })}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-500 transition-colors font-medium"
                  />
                  <input 
                    type="password" 
                    placeholder="API Key de CallMeBot" 
                    value={settings.whatsappApiKey2}
                    onChange={(e) => updateSettings({ whatsappApiKey2: e.target.value })}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-500 transition-colors font-medium"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="btn-premium mt-4 w-full py-4 rounded-xl text-white font-black text-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className="relative z-10">Guardar Configuración WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
