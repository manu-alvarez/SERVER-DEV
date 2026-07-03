import { useState } from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress, Box, Switch, FormControlLabel } from '@mui/material';
import { motion } from 'framer-motion';
import UnifiedInput from './UnifiedInput';
import ResultPanel from './ResultPanel';
import { processText, Nivel, Provider, LANGUAGES, SUMMARY_LEVELS, ProcessResult } from '../api';

interface Props {
  provider: Provider;
  onResult: (input: string, output: string, type: string) => void;
}

export default function ResumirTab({ provider, onResult }: Props) {
  const [texto, setTexto] = useState('');
  const [nivel, setNivel] = useState('normal');
  const [destino, setDestino] = useState('es');
  const [traducir, setTraducir] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult>({ traduccion: '', resumen: '' });
  const [error, setError] = useState('');

  const handleProcesar = async () => {
    if (!texto.trim()) return;
    setLoading(true);
    setError('');
    try {
      const mode = traducir ? 'traducir_resumir' : 'resumir';
      const data = await processText({ texto, origen: 'auto', destino, modo: mode as any, nivelResumen: nivel as Nivel, provider });
      setResult({ traduccion: data.traduccion, resumen: data.resumen, provider: data.provider });
      onResult(texto, data.resumen || data.traduccion, 'resumen');
    } catch (e: any) {
      setError(e?.message || 'Error en el resumen');
    } finally {
      setLoading(false);
    }
  };

  const isValid = texto.trim().length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Nivel de detalle</InputLabel>
              <Select label="Nivel de detalle" value={nivel} onChange={e => setNivel(e.target.value)}>
                {SUMMARY_LEVELS.map(l => <MenuItem key={l.id} value={l.id}>{l.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Idioma</InputLabel>
              <Select label="Idioma" value={destino} onChange={e => { setDestino(e.target.value); setTraducir(true); }}>
                {LANGUAGES.filter(l => l.code !== 'auto').map(l => (
                  <MenuItem key={l.code} value={l.code}>{l.flag} {l.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', justifyContent: 'center' }}>
            <FormControlLabel control={<Switch checked={traducir} onChange={e => setTraducir(e.target.checked)} />} label="Traducir resultado" />
          </Grid>
        </Grid>

        <Button variant="contained" size="large" onClick={handleProcesar} disabled={loading || !isValid}
          sx={{ alignSelf: 'center', px: 6, py: 1.5, borderRadius: 100, fontWeight: 700, fontSize: '1rem' }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Resumir'}
        </Button>
      </Box>

      <UnifiedInput value={texto} onChange={setTexto} disabled={loading} />
      <ResultPanel result={result} error={error} provider={result.provider} />
    </motion.div>
  );
}
