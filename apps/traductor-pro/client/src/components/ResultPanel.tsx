import { useRef } from 'react';
import { Box, Typography, IconButton, Tooltip, Stack, Button, Alert, Chip, Fade } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { jsPDF } from 'jspdf';
import { ProcessResult, Provider, PROVIDERS } from '../api';

interface Props {
  result: ProcessResult;
  error: string;
  provider?: Provider;
}

export default function ResultPanel({ result, error, provider }: Props) {
  const { traduccion, resumen } = result;
  const hasResult = !!(traduccion || resumen);
  const provInfo = PROVIDERS.find(p => p.id === provider);

  const handleCopy = async () => {
    const text = [
      traduccion ? `Traducción:\n${traduccion}` : '',
      resumen ? `Resumen:\n${resumen}` : '',
    ].filter(Boolean).join('\n\n');
    await navigator.clipboard.writeText(text);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const margin = 40;
    const maxWidth = 515;
    doc.setFontSize(18);
    doc.setTextColor('#1a73e8');
    doc.text('Traductor PRO - Resultado', margin, 50);
    let y = 90;

    if (traduccion) {
      doc.setFontSize(13);
      doc.setTextColor('#333');
      doc.setFont('helvetica', 'bold');
      doc.text('Traducción', margin, y);
      y += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(doc.splitTextToSize(traduccion, maxWidth), margin, y);
      y += (doc.splitTextToSize(traduccion, maxWidth).length * 14) + 20;
    }
    if (resumen) {
      doc.setFontSize(13);
      doc.setTextColor('#333');
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen', margin, y);
      y += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(doc.splitTextToSize(resumen, maxWidth), margin, y);
    }
    doc.save('resultado.pdf');
  };

  return (
    <Box sx={{ mt: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!hasResult && !error && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          El resultado aparecerá aquí...
        </Typography>
      )}

      {traduccion && (
        <Fade in timeout={500}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" color="primary" fontWeight={700}>Traducción</Typography>
              {provInfo && <Chip size="small" label={provInfo.label} sx={{ bgcolor: provInfo.color, color: '#fff', fontWeight: 600 }} />}
            </Box>
            <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{traduccion}</Typography>
            </Box>
          </Box>
        </Fade>
      )}

      {resumen && (
        <Fade in timeout={500}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" color="secondary" fontWeight={700}>Resumen</Typography>
              {provInfo && <Chip size="small" label={provInfo.label} sx={{ bgcolor: provInfo.color, color: '#fff', fontWeight: 600 }} />}
            </Box>
            <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{resumen}</Typography>
            </Box>
          </Box>
        </Fade>
      )}

      {hasResult && (
        <Stack direction="row" spacing={1} justifyContent="center">
          <Tooltip title="Copiar al portapapeles">
            <IconButton onClick={handleCopy} color="primary"><ContentCopyIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Descargar PDF">
            <IconButton onClick={handleExportPDF} color="primary"><PictureAsPdfIcon /></IconButton>
          </Tooltip>
        </Stack>
      )}
    </Box>
  );
}
