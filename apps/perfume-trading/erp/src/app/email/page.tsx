'use client';

import React, { useState, useMemo } from 'react';
import { Copy, Check, Send, FileText, Inbox, PenTool, Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { generateEmail, TEMPLATE_TYPES, LANGUAGES } from '@/lib/email-templates';
import type { TemplateType, TemplateLang } from '@/lib/email-templates';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/ui/currency-display';

// AI Backend Connection (To be implemented)
async function extractDataWithAI(text: string) {
  // TODO: Connect to MSBrossAI backend endpoint
  return new Promise<any>((resolve, reject) => {
    // Fail gracefully since AI is not connected yet
    setTimeout(() => {
      reject(new Error("AI backend not connected"));
    }, 1500);
  });
}

export default function EmailPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');

  // Compose State
  const [lang, setLang] = useState<TemplateLang>('ES');
  const [type, setType] = useState<TemplateType>('offer');
  const [copied, setCopied] = useState<'subject' | 'body' | null>(null);
  const [vars, setVars] = useState({
    partnerName: '',
    productName: '',
    brandName: '',
    quantity: 0,
    priceUnit: '',
    totalAmount: '',
    incoterm: '',
    invoiceNumber: '',
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  });

  const email = useMemo(() => generateEmail(type, lang, vars), [type, lang, vars]);

  const copyToClipboard = async (text: string, field: 'subject' | 'body') => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const openInMailto = () => {
    const mailto = `mailto:?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
    window.open(mailto);
  };

  // Inbox State
  const [inboxText, setInboxText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  const handleExtract = async () => {
    setIsExtracting(true);
    try {
      const data = await extractDataWithAI(inboxText);
      setExtractedData(data);
    } catch (e) {
      console.warn("Extracción AI fallida o no implementada", e);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#323130] dark:text-[#e0e0e0]">Correo Comercial y Smart Inbox</h2>
          <p className="text-xs text-[#605E5C] dark:text-[#888]">
            Procesa pedidos con Inteligencia Artificial o redacta ofertas multilingües
          </p>
        </div>
        <Badge variant="info" dot>Módulo Avanzado B2B</Badge>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[#EDEBE9] dark:border-[#333] pb-px">
        <button
          onClick={() => setActiveTab('inbox')}
          className={cn(
            'flex items-center px-4 py-2 text-sm font-semibold border-b-2 transition-colors',
            activeTab === 'inbox' ? 'border-[#f43f5e] text-[#f43f5e] dark:border-[#fb7185] dark:text-[#fb7185]' : 'border-transparent text-[#605E5C] hover:text-[#323130] dark:text-[#888] dark:hover:text-[#ccc]'
          )}
        >
          <Inbox size={16} className="mr-2" />
          Smart Inbox (IA)
        </button>
        <button
          onClick={() => setActiveTab('compose')}
          className={cn(
            'flex items-center px-4 py-2 text-sm font-semibold border-b-2 transition-colors',
            activeTab === 'compose' ? 'border-[#f43f5e] text-[#f43f5e] dark:border-[#fb7185] dark:text-[#fb7185]' : 'border-transparent text-[#605E5C] hover:text-[#323130] dark:text-[#888] dark:hover:text-[#ccc]'
          )}
        >
          <PenTool size={16} className="mr-2" />
          Redactar Ofertas
        </button>
      </div>

      {activeTab === 'inbox' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Source */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <FileText size={16} className="mr-2 text-indigo-500" />
                Correo Entrante (Texto B2B)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <textarea
                className="w-full flex-1 p-3 bg-[#F3F2F1] dark:bg-[#2a2a2a] text-sm text-[#323130] dark:text-[#e0e0e0] border border-[#EDEBE9] dark:border-[#444] rounded outline-none focus:border-indigo-500 transition-colors resize-none min-h-[250px]"
                value={inboxText}
                onChange={(e) => setInboxText(e.target.value)}
                placeholder="Pega el correo del cliente aquí..."
              />
              <Button
                variant="primary"
                className="mt-4 w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleExtract}
                disabled={isExtracting || !inboxText.trim()}
              >
                {isExtracting ? (
                  <span className="flex items-center animate-pulse"><Sparkles size={16} className="mr-2" /> Procesando con IA...</span>
                ) : (
                  <span className="flex items-center"><Sparkles size={16} className="mr-2" /> Extraer Pedido Automáticamente</span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* AI Result */}
          <Card className="flex flex-col bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center text-indigo-700 dark:text-indigo-400">
                <Check size={16} className="mr-2" />
                Borrador de Pedido Generado
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {extractedData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] text-[#605E5C] uppercase font-bold tracking-wider mb-1">Cliente / Socio</p>
                      <p className="font-semibold text-[#323130] dark:text-[#e0e0e0]">{extractedData.partnerName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#605E5C] uppercase font-bold tracking-wider mb-1">Marca</p>
                      <p className="font-semibold text-[#323130] dark:text-[#e0e0e0]">{extractedData.brandName}</p>
                    </div>
                    <div className="col-span-2 border-t border-indigo-100 dark:border-indigo-800 pt-3">
                      <p className="text-[10px] text-[#605E5C] uppercase font-bold tracking-wider mb-1">Producto Requerido</p>
                      <p className="font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded inline-block">
                        {extractedData.productName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#605E5C] uppercase font-bold tracking-wider mb-1">Cantidad</p>
                      <p className="text-2xl font-bold text-[#323130] dark:text-[#e0e0e0]">{extractedData.quantity} <span className="text-sm font-normal text-[#888]">uds</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#605E5C] uppercase font-bold tracking-wider mb-1">Precio Unitario Solicitado</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        <CurrencyDisplay amountUSD={extractedData.priceUnit} />
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-indigo-100 dark:border-indigo-800 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-[#605E5C] uppercase font-bold tracking-wider mb-1">Total Estimado</p>
                      <p className="text-xl font-bold text-[#f43f5e] dark:text-[#fb7185]">
                        <CurrencyDisplay amountUSD={extractedData.quantity * extractedData.priceUnit} />
                      </p>
                    </div>
                    <Button variant="primary" className="bg-green-600 hover:bg-green-700 text-white">
                      Aprobar e Insertar en Trading
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#605E5C] dark:text-[#888] space-y-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Sparkles size={24} className="text-indigo-400" />
                  </div>
                  <p className="text-sm text-center">
                    Pega el contenido de un correo y la IA extraerá automáticamente<br/>
                    el socio B2B, marca, producto, cantidad y precio objetivo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'compose' && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Select label="Idioma" value={lang}
                  onChange={(e) => setLang(e.target.value as TemplateLang)}
                  options={LANGUAGES.map((l) => ({ value: l.key, label: `${l.flag} ${l.label}` }))} />
                <Select label="Tipo de Plantilla" value={type}
                  onChange={(e) => setType(e.target.value as TemplateType)}
                  options={TEMPLATE_TYPES.map((t) => ({
                    value: t.key,
                    label: t.label[lang] ?? t.key,
                  }))} />
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input label="Socio" value={vars.partnerName}
                  onChange={(e) => setVars({ ...vars, partnerName: e.target.value })} />
                <Input label="Marca" value={vars.brandName}
                  onChange={(e) => setVars({ ...vars, brandName: e.target.value })} />
                <Input label="Producto" value={vars.productName}
                  onChange={(e) => setVars({ ...vars, productName: e.target.value })} />
                <Input label="Cantidad" type="number" value={vars.quantity}
                  onChange={(e) => setVars({ ...vars, quantity: Number(e.target.value) })} />
                <Input label="Precio Unit." value={vars.priceUnit}
                  onChange={(e) => setVars({ ...vars, priceUnit: e.target.value })} />
                <Input label="Total" value={vars.totalAmount}
                  onChange={(e) => setVars({ ...vars, totalAmount: e.target.value })} />
                <Input label="Incoterm" value={vars.incoterm}
                  onChange={(e) => setVars({ ...vars, incoterm: e.target.value })} />
                <Input label="Válido Hasta" value={vars.validUntil}
                  onChange={(e) => setVars({ ...vars, validUntil: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <FileText size={16} className="mr-2 text-[#f43f5e]" />
                Asunto
              </CardTitle>
              <Button variant="ghost" size="sm" icon={copied === 'subject' ? Check : Copy}
                onClick={() => copyToClipboard(email.subject, 'subject')}>
                {copied === 'subject' ? 'Copiado' : 'Copiar'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-[#F3F2F1] dark:bg-[#2a2a2a] text-sm font-medium rounded font-mono">
                {email.subject}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <FileText size={16} className="mr-2 text-[#f43f5e]" />
                Cuerpo del Correo
              </CardTitle>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" icon={copied === 'body' ? Check : Copy}
                  onClick={() => copyToClipboard(email.body, 'body')}>
                  {copied === 'body' ? 'Copiado' : 'Copiar'}
                </Button>
                <Button variant="primary" size="sm" icon={Send} onClick={openInMailto}>
                  Abrir en Email
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-[#F3F2F1] dark:bg-[#2a2a2a] text-sm rounded whitespace-pre-wrap font-mono leading-relaxed">
                {email.body}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
