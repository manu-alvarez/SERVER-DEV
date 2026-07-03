import { useState } from 'react';
import { Box, TextField, IconButton, CircularProgress, Alert, Tooltip, Stack, Typography } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ImageIcon from '@mui/icons-material/Image';
import { extractText } from '../api';

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
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al extraer texto');
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
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error en OCR');
    } finally {
      setExtracting(false);
      e.target.value = '';
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        fullWidth multiline minRows={8} maxRows={20}
        label="Texto de entrada"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled || extracting}
        sx={{ '& .MuiOutlinedInput-root': { p: { xs: 2, md: 3 } } }}
      />

      <Stack direction="row" spacing={1} sx={{ position: 'absolute', bottom: 12, right: 12, zIndex: 1, alignItems: 'center' }}>
        {extracting && <CircularProgress size={24} />}
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
          {value.length} caracteres
        </Typography>
        <Tooltip title="Subir documento (PDF, DOCX, TXT)">
          <IconButton color="primary" component="label" disabled={disabled || extracting} size="small">
            <input type="file" accept=".pdf,.docx,.txt" hidden onChange={handleDocumentChange} />
            <FileUploadIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Subir imagen (OCR)">
          <IconButton color="secondary" component="label" disabled={disabled || extracting} size="small">
            <input type="file" accept="image/*" hidden onChange={handleImageChange} />
            <ImageIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {errorMsg && <Alert severity="warning" sx={{ mt: 2 }}>{errorMsg}</Alert>}
    </Box>
  );
}
