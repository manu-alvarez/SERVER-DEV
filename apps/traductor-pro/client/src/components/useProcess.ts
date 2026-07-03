import { useState } from 'react';
import { processText, Modo, Nivel, ProcessResult } from '../api';

export interface ProcessOptions {
  origen: string;
  destino: string;
  modo: Modo;
  nivelResumen: Nivel;
}

export function useProcess() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult>({ traduccion: '', resumen: '' });
  const [error, setError] = useState('');

  const run = async (texto: string, opts: ProcessOptions) => {
    if (!texto.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await processText({ texto, ...opts });
      setResult(res);
    } catch (e: any) {
      setError(e?.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return { loading, result, error, run };
}
