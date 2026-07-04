import { useState } from 'react';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { extractText } from '../api';
import { Textarea } from './ui/Input';
import { Button } from './ui/Button';

interface Props {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export default function UnifiedInput({ value, onChange, disabled }: Props) {
  const [extracting, setExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setExtracting(true);
    try {
      const texto = await extractText(file);
      if (texto.trim()) onChange(texto);
      else setErrorMsg('No se pudo extraer texto del documento.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al extraer texto');
    } finally {
      setExtracting(false);
      e.target.value = '';
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setExtracting(true);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('spa+eng', 1, { logger: () => {} });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      if (data.text.trim()) onChange(data.text);
      else setErrorMsg('No se pudo extraer texto de la imagen.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error en OCR');
    } finally {
      setExtracting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="relative w-full group">
      <Textarea
        placeholder="Escribe, pega texto o sube un documento para comenzar..."
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled || extracting}
        className="min-h-[250px] pb-14 text-base focus-visible:ring-neon-emerald/50 resize-none transition-all duration-300 group-hover:border-white/20"
      />

      <div className="absolute bottom-3 right-3 flex items-center gap-3">
        {extracting && <Loader2 className="animate-spin text-neon-emerald" size={20} />}
        <span className="text-xs text-white/40 mr-2">
          {value.length} caracteres
        </span>
        
        <label title="Subir documento (PDF, DOCX, TXT)">
          <input type="file" accept=".pdf,.docx,.txt" hidden onChange={handleDocumentChange} disabled={disabled || extracting} />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-400 hover:bg-emerald-400/10 pointer-events-none" onClick={() => {}}>
            <span className="pointer-events-auto cursor-pointer flex items-center justify-center">
              <Upload size={18} />
            </span>
          </Button>
        </label>
        
        <label title="Subir imagen (OCR)">
          <input type="file" accept="image/*" hidden onChange={handleImageChange} disabled={disabled || extracting} />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-cyan-400 hover:bg-cyan-400/10 pointer-events-none" onClick={() => {}}>
            <span className="pointer-events-auto cursor-pointer flex items-center justify-center">
              <ImageIcon size={18} />
            </span>
          </Button>
        </label>
      </div>

      {errorMsg && (
        <div className="mt-2 text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
