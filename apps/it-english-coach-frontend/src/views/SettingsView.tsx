import { useAppStore } from '../store';
import { motion } from 'framer-motion';
import { Settings, KeyRound, Cpu, ShieldCheck } from 'lucide-react';

export default function SettingsView() {
  const { settings, updateSettings, updateKey, updateModel } = useAppStore();

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto w-full h-full">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-l-neon-cyan">
        <div>
          <h2 className="text-sm font-mono text-neon-cyan tracking-wider uppercase mb-1">Configuración IA</h2>
          <p className="text-muted text-sm">Gestiona tus modelos de inteligencia artificial y APIs localmente.</p>
        </div>
        <Settings size={32} className="text-neon-cyan opacity-80" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-6 space-y-6"
        >
          <div className="flex items-center gap-2 mb-4 text-white">
            <Cpu size={20} className="text-matrix-green" />
            <h3 className="font-bold">Motor Principal</h3>
          </div>
          
          <div>
            <label className="block text-xs font-mono text-muted mb-2 uppercase">Proveedor Activo</label>
            <select 
              value={settings.provider} 
              onChange={e => updateSettings({ provider: e.target.value as any })}
              className="w-full bg-[#050A14] border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neon-cyan transition-colors"
            >
              <option value="anthropic">Anthropic (Recomendado)</option>
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="groq">Groq</option>
              <option value="openrouter">OpenRouter</option>
              <option value="custom">Local (LM Studio / Ollama)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-muted mb-2 uppercase">Modelo Seleccionado ({settings.provider})</label>
            <input 
              type="text" 
              value={settings.models[settings.provider] || ''} 
              onChange={e => updateModel(settings.provider, e.target.value)}
              className="w-full bg-[#050A14] border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neon-cyan transition-colors font-mono"
            />
          </div>

          {settings.provider === 'custom' && (
            <div>
              <label className="block text-xs font-mono text-muted mb-2 uppercase">URL Base Local</label>
              <input 
                type="text" 
                value={settings.customBase} 
                onChange={e => updateSettings({ customBase: e.target.value })}
                className="w-full bg-[#050A14] border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neon-cyan font-mono"
              />
            </div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-panel rounded-2xl p-6 space-y-6"
        >
          <div className="flex items-center gap-2 mb-4 text-white">
            <KeyRound size={20} className="text-amber-500" />
            <h3 className="font-bold">Credenciales API</h3>
          </div>
          
          {settings.provider !== 'custom' && (
            <div>
              <label className="block text-xs font-mono text-muted mb-2 uppercase">API Key ({settings.provider})</label>
              <input 
                type="password" 
                value={settings.keys[settings.provider] || ''} 
                onChange={e => updateKey(settings.provider, e.target.value)}
                className="w-full bg-[#050A14] border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neon-cyan font-mono"
                placeholder="sk-..."
              />
            </div>
          )}

          <div className="bg-surface2 border border-border/50 rounded-xl p-4 flex items-start gap-3 mt-4">
            <ShieldCheck size={24} className="text-matrix-green shrink-0 mt-0.5" />
            <p className="text-xs text-muted leading-relaxed">
              Las claves de API se almacenan cifradas en el <code>localStorage</code> de tu navegador actual. Nunca se envían a ningún servidor externo aparte del proveedor seleccionado.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
