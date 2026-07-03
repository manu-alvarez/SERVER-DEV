import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function Seguimiento({ onExit }) {
  const [speed, setSpeed] = useState(6)
  const [visible, setVisible] = useState(true)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [color, setColor] = useState('#FF3B30')
  const interval = useRef(null)
  const containerRef = useRef(null)

  // Hidden slider toggle (mobile-friendly toggle via on-screen corner)
  const [showSlider, setShowSlider] = useState(false)
  const toggle = () => setShowSlider(s => !s)

  // move to new random position
  const move = () => {
    const w = containerRef.current?.clientWidth || 800
    const h = containerRef.current?.clientHeight || 600
    const nx = Math.random() * 90 + 5
    const ny = Math.random() * 90 + 5
    setPos({ x: nx, y: ny })
    setColor(prev => (prev === '#E74C3C' ? '#F1C40F' : '#E74C3C'))
  }
  useEffect(() => {
    interval.current = setInterval(move, speed * 1000)
    return () => clearInterval(interval.current)
  }, [speed])

  // Track user interaction to keep on screen
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh', background: '#d9d9d9', position: 'relative' }}>
      {/* Corner toggle for mobile to reveal speed slider */}
      <div className="fixed top-0 left-0 w-14 h-14 z-40" onClick={toggle} aria-label="Mostrar control de velocidad"></div>
      {/* Parental lock button */}
      <div className="fixed top-4 left-4 z-50" onDoubleClick={toggle} />
      {showSlider && (
        <div className="fixed top-6 left-6 z-50 bg-foreground/80 text-black p-3 rounded">
          <label>Velocidad: {speed}s</label>
          <input type="range" min={2} max={12} step={0.5} value={speed} onChange={e => setSpeed(Number(e.target.value))} />
        </div>
      )}
      <motion.div
        initial={{ left: '50%', top: '50%' }}
        animate={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        transition={{ type: 'spring', stiffness: 60, damping: 15 }}
        style={{ position: 'absolute', width: 60, height: 60, borderRadius: '50%', background: color }}
      />
      <button onClick={() => onExit()} className="fixed bottom-4 right-4 text-white bg-black/40 px-4 py-2 rounded" aria-label="Salir">Salir</button>
    </div>
  )
}
