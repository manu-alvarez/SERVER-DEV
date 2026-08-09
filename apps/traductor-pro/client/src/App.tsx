import { useState } from 'react';
import { Languages, FileText, Wrench, History, Bot } from 'lucide-react';
import TraducirTab from './components/TraducirTab';
import ResumirTab from './components/ResumirTab';
import ExtrasTab from './components/ExtrasTab';
import HistoryPanel from './components/HistoryPanel';
import { AmbientGlow } from './components/ui/index';
import { useAppStore } from './store';
import { Button } from './components/ui/Button';
import { Select } from './components/ui/Select';
import { PROVIDERS } from './api';
import ApiConfigWrapper from './components/ui/ApiConfigWrapper';

export default function App() {
  const [tab, setTab] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const history = useAppStore(state => state.history);
  const provider = useAppStore(state => state.provider);
  const setProvider = useAppStore(state => state.setProvider);

  const tabs = [
    { id: 0, icon: <Languages size={20} />, label: 'Traducir' },
    { id: 1, icon: <FileText size={20} />, label: 'Resumir' },
    { id: 2, icon: <Wrench size={20} />, label: 'Extras' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-zinc-950 text-slate-200">
      <ApiConfigWrapper />
      <AmbientGlow />
      
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
              Traductor <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]">PRO</span>
            </h1>
            <p className="text-slate-400">
              Traducción y resumen inteligente con alta disponibilidad automática
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-lg">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Bot size={20} />
            </div>
            <Select 
              value={provider} 
              onChange={e => setProvider(e.target.value as any)}
              options={PROVIDERS.map(p => ({ value: p.id, label: p.label }))}
              className="w-40 border-none bg-transparent shadow-none"
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="w-full max-w-4xl mx-auto flex-1 pb-24">
          {tab === 0 && <TraducirTab />}
          {tab === 1 && <ResumirTab />}
          {tab === 2 && <ExtrasTab />}
        </div>

        {/* Bottom Dock */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90]">
          <div className="flex items-center gap-1 p-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 font-medium ${
                  tab === t.id 
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* History FAB */}
        <div className="fixed top-6 right-6 z-[90]">
          <Button 
            variant="glass" 
            size="icon" 
            className="rounded-full h-12 w-12 relative"
            onClick={() => setHistoryOpen(true)}
          >
            <History size={22} className="text-emerald-400" />
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-zinc-950">
                {history.length > 99 ? '99+' : history.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
