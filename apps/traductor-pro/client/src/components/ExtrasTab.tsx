import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import UnifiedInput from './UnifiedInput';
import ResultPanel from './ResultPanel';
import { processExtras, EXTRA_TOOLS, ExtrasPayload } from '../api';
import { useAppStore } from '../store';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { GlassCard } from './ui/index';

export default function ExtrasTab() {
  const [texto, setTexto] = useState('');
  const [herramienta, setHerramienta] = useState('keywords');
  
  const provider = useAppStore(state => state.provider);
  const addToHistory = useAppStore(state => state.addToHistory);

  const tool = EXTRA_TOOLS.find(t => t.id === herramienta);

  const mutation = useMutation({
    mutationFn: (payload: ExtrasPayload) => processExtras(payload),
    onSuccess: (data) => {
      addToHistory({
        type: 'extras',
        input: texto,
        output: data.resultado,
        provider: data.provider || provider,
      });
    }
  });

  const handleProcesar = () => {
    if (!texto.trim()) return;
    mutation.mutate({ texto, herramienta, provider });
  };

  const isValid = texto.trim().length > 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlassCard className="p-4 sm:p-6 mb-6">
        <div className="max-w-md mx-auto mb-6">
          <div className="space-y-2 mb-4">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider ml-1">Herramienta</label>
            <Select 
              value={herramienta} 
              onChange={e => setHerramienta(e.target.value)}
              options={EXTRA_TOOLS.map(t => ({ value: t.id, label: t.label }))}
            />
          </div>

          {tool && (
            <div className="p-3 bg-white/5 rounded-xl text-center border border-white/5 mb-6">
              <span className="text-sm text-white/60">{tool.desc}</span>
            </div>
          )}

          <div className="flex justify-center">
            <Button 
              variant="neon" 
              size="lg" 
              onClick={handleProcesar} 
              disabled={mutation.isPending || !isValid}
              className="w-full sm:w-auto min-w-[200px] border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)] bg-neon-purple/20 text-purple-400 hover:bg-neon-purple/30"
            >
              {mutation.isPending ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Ejecutar Herramienta'}
            </Button>
          </div>
        </div>

        <UnifiedInput value={texto} onChange={setTexto} disabled={mutation.isPending} />
      </GlassCard>

      {(mutation.data || mutation.isError) && (
        <ResultPanel 
          result={{ traduccion: '', resumen: '', resultado: mutation.data?.resultado }} 
          error={mutation.error?.message || ''} 
          provider={mutation.data?.provider || provider} 
        />
      )}
    </div>
  );
}
