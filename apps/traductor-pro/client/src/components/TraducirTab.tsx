import { useState, useEffect } from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress, Box } from '@mui/material';
import { motion } from 'framer-motion';
// @ts-ignore
import { franc } from 'franc-min';
import UnifiedInput from './UnifiedInput';
import ResultPanel from './ResultPanel';
import { processText, Modo, Provider, LANGUAGES, TRANSLATION_MODES, ProcessResult } from '../api';

const FRANC_MAP: Record<string, string> = {
  'spa': 'es', 'eng': 'en', 'fra': 'fr', 'por': 'pt',
  'ita': 'it', 'deu': 'de', 'nld': 'nl', 'cmn': 'zh', 'zho': 'zh',
  'jpn': 'ja', 'kor': 'ko', 'rus': 'ru', 'arb': 'ar'
};

interface Props {
  provider: Provider;
  onResult: (input: string, output: string, type: string) => void;
}

export default function TraducirTab({ provider, onResult }: Props) {
  const [texto, setTexto] = useState('');
  const [origen, setOrigen] = useState('auto');
  const [destino, setDestino] = useState('es');
  const [modo, setModo] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult>({ traduccion: '', resumen: '' });
  const [error, setError] = useState('');

  // Auto-detect language
  useEffect(() => {
    if (texto.trim().length > 10 && origen === 'auto') {
      const code3 = franc(texto);
      if (code3 && FRANC_MAP[code3]) {
        setOrigen(FRANC_MAP[code3]);
      }
    }
  }, [texto, origen]);

  const handleProcesar = async () => {
    if (!texto.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await processText({ texto, origen, destino, modo: modo as Modo, nivelResumen: 'normal', provider });
      setResult({ traduccion: data.traduccion, resumen: '', provider: data.provider });
      onResult(texto, data.traduccion, 'traduccion');
    } catch (e: any) {
      setError(e?.message || 'Error en la traducción');
    } finally {
      setLoading(false);
    }
  };

  const isValid = texto.trim().length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Idioma origen</InputLabel>
              <Select label="Idioma origen" value={origen} onChange={e => setOrigen(e.target.value)}>
                {LANGUAGES.map(l => <MenuItem key={l.code} value={l.code}>{l.flag} {l.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Idioma destino</InputLabel>
              <Select label="Idioma destino" value={destino} onChange={e => setDestino(e.target.value)}>
                {LANGUAGES.filter(l => l.code !== 'auto').map(l => (
                  <MenuItem key={l.code} value={l.code}>{l.flag} {l.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select label="Tipo" value={modo} onChange={e => setModo(e.target.value)}>
                {TRANSLATION_MODES.map(m => <MenuItem key={m.id} value={m.id}>{m.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Button variant="contained" size="large" onClick={handleProcesar} disabled={loading || !isValid}
          sx={{ alignSelf: 'center', px: 6, py: 1.5, borderRadius: 100, fontWeight: 700, fontSize: '1rem' }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Traducir'}
        </Button>
      </Box>

      <UnifiedInput value={texto} onChange={setTexto} disabled={loading} />
      <ResultPanel result={result} error={error} provider={result.provider} />
    </motion.div>
  );
}
