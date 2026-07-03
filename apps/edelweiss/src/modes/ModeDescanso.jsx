import React from 'react'
import ParentalLockButton from '../components/ParentalLockButton'
export default function Descanso({ onExit }) {
  // immersive gradient with floating leaves
  const leaves = Array.from({ length: 6 }, (_, i) => i)
  return (
    <div style={{ width: '100%', height: '100vh', background: 'linear-gradient(135deg, #2ECC71 0%, #3498DB 60%, #2ECC71 100%)' }}>
      <ParentalLockButton onExit={onExit} />
      {leaves.map(i => (
        <div key={i} style={{ position: 'absolute', left: `${(i * 17) % 100}%`, top: `${(i * 23) % 100}%`, width: 120, height: 60, opacity: 0.6, transform: 'translate(-50%, -50%)' }}>
          <svg viewBox="0 0 200 100" width="120" height="60" preserveAspectRatio="xMidYMid meet">
            <ellipse cx="100" cy="50" rx="90" ry="40" fill="#1D8F54" opacity="0.4" />
          </svg>
        </div>
      ))}
    </div>
  )
}
