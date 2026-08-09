import { useState, useEffect, useRef } from 'react';

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  free: boolean;
}

const API_BASE = window.location.hostname === 'msbross.me' || window.location.hostname === 'iaprod.manuelalvarez.dev'
  ? '/_iaprod/api'
  : ((import.meta as any).env.VITE_API_BASE_URL || `http://${window.location.hostname}:8006/api`);

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export default function ModelSelector({ selected, onSelect }: Props) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const adminToken = localStorage.getItem('msbross_godmode_token');
    const customKeys = localStorage.getItem('msbross_user_api_key');
    const headers: Record<string, string> = {};
    if (adminToken) headers['x-godmode-token'] = adminToken;
    if (customKeys) headers['x-user-custom-keys'] = customKeys;

    fetch(`${API_BASE}/models`, { headers })
      .then(r => r.json())
      .then((data: ModelInfo[]) => {
        if (Array.isArray(data)) {
          setModels(data);
          if (!selected && data.length > 0) onSelect(data[0].id);
        } else {
          setModels([]);
        }
      })
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = models.find(m => m.id === selected);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          color: '#94a3b8',
          padding: '6px 14px',
          borderRadius: '8px',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: current ? '#3b82f6' : '#64748b' }} />
        {current ? current.name : 'Select Model'}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && models.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '6px',
          background: '#0f172a',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '10px',
          padding: '4px',
          zIndex: 1000,
          minWidth: '220px',
          maxHeight: '300px',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {models.map(m => (
            <button
              key={m.id}
              onClick={() => { onSelect(m.id); setOpen(false); }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '8px 12px',
                background: m.id === selected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                border: 'none',
                color: '#f1f5f9',
                cursor: 'pointer',
                borderRadius: '8px',
                fontSize: '12px',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <span>{m.name}</span>
              <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>{m.provider}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
