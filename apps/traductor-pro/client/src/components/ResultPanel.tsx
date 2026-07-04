import { jsPDF } from 'jspdf';
import { Copy, FileDown } from 'lucide-react';
import { ProcessResult, Provider, PROVIDERS } from '../api';
import { Button } from './ui/Button';

interface Props {
  result: ProcessResult;
  error: string;
  provider?: Provider | string;
}

export default function ResultPanel({ result, error, provider }: Props) {
  const { traduccion, resumen, resultado } = result as any;
  const hasResult = !!(traduccion || resumen || resultado);
  const provInfo = PROVIDERS.find(p => p.id === provider);

  const handleCopy = async () => {
    const text = [
      traduccion ? `Traducción:\n${traduccion}` : '',
      resumen ? `Resumen:\n${resumen}` : '',
      resultado ? `Resultado:\n${resultado}` : '',
    ].filter(Boolean).join('\n\n');
    await navigator.clipboard.writeText(text);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const margin = 40;
    const maxWidth = 515;
    doc.setFontSize(18);
    doc.setTextColor('#10b981'); // Emerald
    doc.text('Traductor PRO - Resultado', margin, 50);
    let y = 90;

    const addSection = (title: string, content: string) => {
      doc.setFontSize(13);
      doc.setTextColor('#333');
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, y);
      y += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(content, maxWidth);
      doc.text(lines, margin, y);
      y += (lines.length * 14) + 20;
    };

    if (traduccion) addSection('Traducción', traduccion);
    if (resumen) addSection('Resumen', resumen);
    if (resultado) addSection('Resultado', resultado);

    doc.save('resultado.pdf');
  };

  return (
    <div className="mt-6">
      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20 shadow-[0_0_15px_rgba(248,113,113,0.1)]">
          {error}
        </div>
      )}

      {!hasResult && !error && (
        <div className="text-sm text-white/40 text-center py-8">
          El resultado aparecerá aquí...
        </div>
      )}

      {hasResult && (
        <div className="space-y-6">
          {traduccion && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-lg font-bold text-emerald-400">Traducción</h3>
                {provInfo && (
                  <span className="text-xs font-bold px-2 py-1 rounded-full text-white shadow-sm" style={{ backgroundColor: provInfo.color }}>
                    {provInfo.label}
                  </span>
                )}
              </div>
              <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-white whitespace-pre-wrap leading-relaxed text-[15px]">
                {traduccion}
              </div>
            </div>
          )}

          {resumen && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-lg font-bold text-cyan-400">Resumen</h3>
                {provInfo && (
                  <span className="text-xs font-bold px-2 py-1 rounded-full text-white shadow-sm" style={{ backgroundColor: provInfo.color }}>
                    {provInfo.label}
                  </span>
                )}
              </div>
              <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-white whitespace-pre-wrap leading-relaxed text-[15px]">
                {resumen}
              </div>
            </div>
          )}

          {resultado && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-lg font-bold text-purple-400">Resultado Extra</h3>
                {provInfo && (
                  <span className="text-xs font-bold px-2 py-1 rounded-full text-white shadow-sm" style={{ backgroundColor: provInfo.color }}>
                    {provInfo.label}
                  </span>
                )}
              </div>
              <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-white whitespace-pre-wrap leading-relaxed text-[15px]">
                {resultado}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 pt-4">
            <Button variant="glass" size="icon" onClick={handleCopy} title="Copiar al portapapeles">
              <Copy size={20} className="text-emerald-400" />
            </Button>
            <Button variant="glass" size="icon" onClick={handleExportPDF} title="Descargar PDF">
              <FileDown size={20} className="text-cyan-400" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
