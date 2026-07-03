'use client'

import { motion } from 'framer-motion'

export function FamilyScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)

  const config = score >= 0.8
    ? { color: '#FF6B6B', bg: 'rgba(255,107,107,0.15)', label: '🌟 Ideal para Edelweiss' }
    : score >= 0.6
    ? { color: '#FFE66D', bg: 'rgba(255,230,109,0.15)', label: '👍 Bueno para la familia' }
    : { color: '#4ECDC4', bg: 'rgba(78,205,196,0.15)', label: '💪 Opción válida' }

  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: config.color }}>
          👶 Family Score
        </span>
        <span className="text-xs font-bold font-mono" style={{ color: config.color }}>
          {pct}% {config.label.split(' ')[0]}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${config.color}, ${score >= 0.8 ? '#FFE66D' : score >= 0.6 ? '#4ECDC4' : '#FF6B6B'})`,
            boxShadow: `0 0 12px ${config.color}40`,
          }}
        />
      </div>
      <div className="text-[9px] font-mono mt-0.5" style={{ color: config.color }}>
        {config.label}
      </div>
    </div>
  )
}
