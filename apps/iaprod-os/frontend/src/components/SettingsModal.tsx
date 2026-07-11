import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const [keys, setKeys] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('iaprod_custom_keys');
      if (stored) setKeys(JSON.parse(stored));
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('iaprod_custom_keys', JSON.stringify(keys));
    onClose();
  };

  const providers = ['openai', 'anthropic', 'gemini', 'groq', 'openrouter'];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'rgba(15, 15, 20, 0.95)', padding: '30px', borderRadius: '15px',
        width: '90%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)', color: 'white'
      }}>
        <h2 style={{ marginBottom: '10px', fontSize: '20px', fontWeight: 'bold' }}>Configuración de APIs</h2>
        <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '20px' }}>
          Configura tus propias API keys para anular el backend por defecto.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '50vh', overflowY: 'auto' }}>
          {providers.map(prov => (
            <div key={prov} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', textTransform: 'capitalize', color: '#ccc' }}>{prov} API Key</label>
              <input
                type="password"
                value={keys[prov] || ''}
                onChange={e => setKeys({ ...keys, [prov]: e.target.value })}
                placeholder="sk-..."
                style={{
                  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white', padding: '10px', borderRadius: '8px', fontSize: '14px'
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', borderRadius: '8px', cursor: 'pointer'
          }}>Cancelar</button>
          <button onClick={handleSave} style={{
            padding: '10px 20px', background: '#3b82f6', border: 'none',
            color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
          }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
