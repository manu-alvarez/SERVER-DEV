import React from 'react';

const TABLES = [
  { id: 1, d: 'M 150 100 L 200 75 L 250 100 L 200 125 Z', zone: 'INTERIOR', cap: 2 },
  { id: 2, d: 'M 250 150 L 300 125 L 350 150 L 300 175 Z', zone: 'INTERIOR', cap: 2 },
  { id: 3, d: 'M 100 250 L 180 210 L 260 250 L 180 290 Z', zone: 'INTERIOR', cap: 4 },
  { id: 4, d: 'M 300 300 L 380 260 L 460 300 L 380 340 Z', zone: 'INTERIOR', cap: 4 },
  { id: 5, d: 'M 500 100 L 580 60 L 660 100 L 580 140 Z', zone: 'TERRAZA', cap: 4 },
  { id: 6, d: 'M 550 250 L 650 200 L 750 250 L 650 300 Z', zone: 'TERRAZA', cap: 6 },
  { id: 7, d: 'M 150 450 L 280 385 L 410 450 L 280 515 Z', zone: 'VIP', cap: 8 },
];

export default function MapIsometric({ onClose, onSelectTable }) {
  return (
    <div className="luxury-modal-overlay" onClick={onClose}>
      <div className="luxury-modal-content" style={{ maxWidth: '1200px' }} onClick={e => e.stopPropagation()}>
        <button className="close-luxury" onClick={onClose}>&times;</button>
        
        <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '3.5rem', color: 'var(--gold-primary)', marginBottom: '1rem' }}>PLANTA ARQUITECTÓNICA</h2>
          <div style={{ width: '80px', height: '2px', background: 'var(--gold-primary)', margin: '0 auto' }}></div>
        </header>

        <div className="iso-map-container">
          <svg viewBox="0 0 1000 600" className="iso-blueprint">
            {/* Architectural Grid / Zones */}
            <path d="M 50 300 L 500 75 L 950 300 L 500 525 Z" fill="none" stroke="rgba(212, 175, 55, 0.1)" strokeWidth="1" />
            
            {/* Interior Zone Floor */}
            <path d="M 50 300 L 400 125 L 750 300 L 400 475 Z" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
            <text x="100" y="200" className="table-label" style={{ opacity: 0.3 }}>STUDIO INTERIOR</text>

            {/* Terraza Zone Floor */}
            <path d="M 450 100 L 650 0 L 850 100 L 650 200 Z" fill="rgba(59, 130, 246, 0.05)" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="0.5" transform="translate(100, 50)" />
            <text x="600" y="50" className="table-label" style={{ fill: 'var(--accent-blue)', opacity: 0.4 }}>TERRAZA EXTERIOR</text>

            {/* VIP Zone Floor */}
            <path d="M 100 450 L 350 325 L 600 450 L 350 575 Z" fill="rgba(212, 175, 55, 0.08)" stroke="var(--gold-primary)" strokeWidth="1" transform="translate(150, 0)" />
            <text x="350" y="550" className="table-label" style={{ fill: 'var(--gold-primary)' }}>ZONA VIP PRIVADA</text>

            {/* Tables */}
            {TABLES.map(t => (
              <g key={t.id} onClick={() => onSelectTable?.(t.id)}>
                <path d={t.d} className="table-surface" />
                <text 
                  x={parseFloat(t.d.split(' ')[1]) + 50} 
                  y={parseFloat(t.d.split(' ')[2]) + 10} 
                  className="table-label"
                  textAnchor="middle"
                >
                  MESA {t.id}
                </text>
                <text 
                  x={parseFloat(t.d.split(' ')[1]) + 50} 
                  y={parseFloat(t.d.split(' ')[2]) + 25} 
                  style={{ fill: 'rgba(255,255,255,0.4)', fontSize: '10px' }}
                  textAnchor="middle"
                >
                  Capacidad: {t.cap}p
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
