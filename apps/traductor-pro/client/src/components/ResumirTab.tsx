import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import UnifiedInput from './UnifiedInput';
import ResultPanel from './ResultPanel';
import { processText, Nivel, LANGUAGES, SUMMARY_LEVELS, ProcessPayload } from '../api';
import { useAppStore } from '../store';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Switch } from './ui/Switch';
import { GlassCard } from './ui/index';

export default function ResumirTab() {
  const [texto, setTexto] = useState('');
  const [nivel, setNivel] = useState('normal');
  const [destino, setDestino] = useState('es');
  const [traducir, setTraducir] = useState(false);
  
  const provider = useAppStore(state => state.provider);
  const addToHistory = useAppStore(state => state.addToHistory);

  const mutation = useMutation({
    mutationFn: (payload: ProcessPayload) => processText(payload),
    onSuccess: (data) => {
      addToHistory({
        type: 'resumen',
        input: texto,
        output: data.resumen || data.traduccion,
        provider: data.provider || provider,
        targetLang: traducir ? destino : undefined
      });
    }
  });

  const handleProcesar = () => {
    if (!texto.trim()) return;
    const mode = traducir ? 'traducir_resumir' : 'resumir';
    mutation.mutate({ 
      texto, 
      origen: 'auto', 
      destino, 
      modo: mode as any, 
      nivelResumen: nivel as Nivel, 
      provider 
    });
  };

  const isValid = texto.trim().length > 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlassCard className="p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 items-center">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider ml-1">Nivel de detalle</label>
            <Select 
              value={nivel} 
              onChange={e => setNivel(e.target.value)}
              options={SUMMARY_LEVELS.map(l => ({ value: l.id, label: l.label }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider ml-1">Idioma</label>
            <Select 
              value={destino} 
              onChange={e => { setDestino(e.target.value); setTraducir(true); }}
              options={LANGUAGES.filter(l => l.code !== 'auto').map(l => ({ value: l.code, label: `${l.flag} ${l.label}` }))}
            />
          </div>
          <div className="flex items-center justify-center space-x-3 mt-4 sm:mt-6">
            <Switch checked={traducir} onCheckedChange={setTraducir} id="traducir-switch" />
            <label htmlFor="traducir-switch" className="text-sm text-white cursor-pointer select-none">Traducir resultado</label>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <Button 
            variant="neon" 
            size="lg" 
            onClick={handleProcesar} 
            disabled={mutation.isPending || !isValid}
            className="w-full sm:w-auto min-w-[200px] border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)] bg-neon-emerald/20 text-emerald-400 hover:bg-neon-emerald/30"
          >
            {mutation.isPending ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Generar Resumen'}
          </Button>
        </div>

        <UnifiedInput value={texto} onChange={setTexto} disabled={mutation.isPending} />
      </GlassCard>

      {(mutation.data || mutation.isError) && (
        <ResultPanel 
          result={mutation.data || { traduccion: '', resumen: '' }} 
          error={mutation.error?.message || ''} 
          provider={mutation.data?.provider || provider} 
        />
      )}
    </div>
  );
}
