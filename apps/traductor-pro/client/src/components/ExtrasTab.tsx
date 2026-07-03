import { useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Button, CircularProgress, Box, Card, CardContent, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import UnifiedInput from './UnifiedInput';
import ResultPanel from './ResultPanel';
import { Provider, processExtras, EXTRA_TOOLS, ProcessResult } from '../api';

interface Props {
  provider: Provider;
  onResult: (input: string, output: string, type: string) => void;
}

export default function ExtrasTab({ provider, onResult }: Props) {
  const [texto, setTexto] = useState('');
  const [herramienta, setHerramienta] = useState('keywords');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult>({ traduccion: '', resumen: '' });
  const [error, setError] = useState('');

  const tool = EXTRA_TOOLS.find(t => t.id === herramienta);

  const handleProcesar = async () => {
    if (!texto.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await processExtras({ texto, herramienta, provider });
      setResult({ traduccion: '', resumen: data.resultado, provider: data.provider as any });
      onResult(texto, data.resultado, `extras:${herramienta}`);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Herramienta</InputLabel>
          <Select label="Herramienta" value={herramienta} onChange={e => setHerramienta(e.target.value)}>
            {EXTRA_TOOLS.map(t => <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>)}
          </Select>
        </FormControl>

        {tool && (
          <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">{tool.desc}</Typography>
            </CardContent>
          </Card>
        )}

        <Button variant="contained" size="large" onClick={handleProcesar} disabled={loading || !texto.trim()}
          sx={{ alignSelf: 'center', px: 6, py: 1.5, borderRadius: 100, fontWeight: 700, fontSize: '1rem' }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Ejecutar'}
        </Button>
      </Box>

      <UnifiedInput value={texto} onChange={setTexto} disabled={loading} />
      <ResultPanel result={result} error={error} provider={result.provider as any} />
    </motion.div>
  );
}
