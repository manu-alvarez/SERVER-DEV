'use client';

import React, { useState } from 'react';
import { ExternalLink, Shield, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// ─── URL Integration Config ───
interface ExternalSource {
  id: string;
  name: string;
  url: string;
  type: 'iframe' | 'api' | 'link';
  description: string;
  icon?: string;
}

/**
 * ExternalBridge — Componente universal de integración de fuentes externas.
 *
 * Jerarquía de decisión:
 * 1. iframe: Herramientas visuales embebidas (gráficos, trackers)
 * 2. api:   Fuentes con API pública (precios, tasas)
 * 3. link:  Servicios externos complejos (acceso directo)
 */
export function ExternalBridge({ sources }: { sources: ExternalSource[] }) {
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [apiData, setApiData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = sources.find((s) => s.id === activeSource) ?? sources[0];

  const handleFetchAPI = async (source: ExternalSource) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bridge?url=${encodeURIComponent(source.url)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setApiData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      setApiData(null);
    } finally {
      setLoading(false);
    }
  };

  if (sources.length === 0) return null;

  const renderContent = () => {
    if (!active) return null;

    if (active.type === 'iframe') {
      return (
        <div className="relative w-full" style={{ height: '500px' }}>
          <iframe
            src={active.url}
            className="w-full h-full border-0 rounded"
            sandbox="allow-scripts allow-same-origin allow-popups"
            title={active.name}
            loading="lazy"
          />
          <div className="absolute bottom-2 right-2 flex items-center space-x-1 bg-black/60 text-white px-2 py-1 rounded text-[10px]">
            <Shield size={10} />
            <span>Sandbox segura</span>
          </div>
        </div>
      );
    }

    if (active.type === 'api') {
      return (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={() => handleFetchAPI(active)}
              disabled={loading}
              className="flex items-center px-3 py-1.5 bg-[#f43f5e] text-white text-xs font-semibold hover:bg-[#e11d48] disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={14} className={cn('mr-1.5', loading && 'animate-spin')} />
              {loading ? 'Consultando...' : 'Obtener Datos'}
            </button>
            <a
              href={active.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-1.5 border border-[#8A8886] text-xs font-semibold hover:bg-[#F3F2F1] transition-colors"
            >
              <ExternalLink size={14} className="mr-1.5" />
              Abrir fuente
            </a>
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs rounded">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {apiData && (
            <pre className="p-3 bg-[#F3F2F1] dark:bg-[#2a2a2a] rounded text-xs overflow-auto max-h-64 font-mono">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          )}
        </div>
      );
    }

    // type === 'link'
    return (
      <div className="text-center py-8">
        <ExternalLink size={32} className="mx-auto mb-3 text-[#605E5C]" />
        <p className="text-sm text-[#605E5C] dark:text-[#888] mb-4">{active.description}</p>
        <a
          href={active.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-[#f43f5e] text-white text-sm font-semibold hover:bg-[#e11d48] transition-colors"
        >
          <ExternalLink size={16} className="mr-2" />
          Acceder a {active.name}
        </a>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ExternalLink size={16} className="mr-2 text-[#f43f5e]" />
          Integraciones Externas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Source Selector */}
        {sources.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {sources.map((source) => (
              <button
                key={source.id}
                onClick={() => {
                  setActiveSource(source.id);
                  setApiData(null);
                  setError(null);
                }}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold border transition-colors',
                  activeSource === source.id || (!activeSource && source === sources[0])
                    ? 'bg-[#f43f5e] text-white border-[#f43f5e]'
                    : 'bg-white dark:bg-[#2b2b2b] text-[#605E5C] border-[#EDEBE9] dark:border-[#444] hover:bg-[#F3F2F1]'
                )}
              >
                {source.name}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {active && (
          <div>
            <p className="text-xs text-[#605E5C] dark:text-[#888] mb-3">{active.description}</p>
            {renderContent()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Bridge API Route Handler ───
// This is consumed by the /api/bridge route
export async function fetchExternalData(url: string): Promise<unknown> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Teringo/1.0',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }

    const text = await response.text();
    return { raw: text.substring(0, 5000) };
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Failed to fetch external data'
    );
  }
}
