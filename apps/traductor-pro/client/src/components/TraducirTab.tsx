import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
// @ts-ignore
import { franc } from 'franc-min';
import UnifiedInput from './UnifiedInput';
import ResultPanel from './ResultPanel';
import { processText, Modo, LANGUAGES, TRANSLATION_MODES, ProcessPayload } from '../api';
import { useAppStore } from '../store';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { GlassCard } from './ui/index';

const FRANC_MAP: Record<string, string> = {
  'spa': 'es', 'eng': 'en', 'fra': 'fr', 'por': 'pt',
  'ita': 'it', 'deu': 'de', 'nld': 'nl', 'cmn': 'zh', 'zho': 'zh',
  'jpn': 'ja', 'kor': 'ko', 'rus': 'ru', 'arb': 'ar'
};

export default function TraducirTab() {
  const [texto, setTexto] = useState('');
  const [origen, setOrigen] = useState('auto');
  const [destino, setDestino] = useState('es');
  const [modo, setModo] = useState('normal');
  const provider = useAppStore(state => state.provider);
  const addToHistory = useAppStore(state => state.addToHistory);

  const mutation = useMutation({
    mutationFn: (payload: ProcessPayload) => processText(payload),
    onSuccess: (data) => {
      addToHistory({
        type: 'traduccion',
        input: texto,
        output: data.traduccion,
        provider: data.provider || provider,
        sourceLang: origen,
        targetLang: destino
      });
    }
  });

  // Auto-detect language
  useEffect(() => {
    if (texto.trim().length > 10 && origen === 'auto') {
      const code3 = franc(texto);
      if (code3 && FRANC_MAP[code3]) {
        setOrigen(FRANC_MAP[code3]);
      }
    }
  }, [texto, origen]);

  const handleProcesar = () => {
    if (!texto.trim()) return;
    mutation.mutate({ texto, origen, destino, modo: modo as Modo, nivelResumen: 'normal', provider });
  };

  const isValid = texto.trim().length > 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlassCard className="p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider ml-1">Idioma origen</label>
            <Select 
              value={origen} 
              onChange={e => setOrigen(e.target.value)}
              options={LANGUAGES.map(l => ({ value: l.code, label: `${l.flag} ${l.label}` }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider ml-1">Idioma destino</label>
            <Select 
              value={destino} 
              onChange={e => setDestino(e.target.value)}
              options={LANGUAGES.filter(l => l.code !== 'auto').map(l => ({ value: l.code, label: `${l.flag} ${l.label}` }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider ml-1">Tipo</label>
            <Select 
              value={modo} 
              onChange={e => setModo(e.target.value)}
              options={TRANSLATION_MODES.map(m => ({ value: m.id, label: m.label }))}
            />
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <Button 
            variant="neon" 
            size="lg" 
            onClick={handleProcesar} 
            disabled={mutation.isPending || !isValid}
            className="w-full sm:w-auto min-w-[200px]"
          >
            {mutation.isPending ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Traducir Texto'}
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
