import React from 'react'

export function GamificationBadge({ name, icon, unlocked }: { name: string, icon: React.ReactNode, unlocked: boolean }) {
  return (
    <div className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${unlocked ? 'border-brand-500 bg-brand-50 text-brand-900' : 'border-surface-200 bg-surface-50 text-surface-400 opacity-50'}`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${unlocked ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-surface-200 text-surface-500'}`}>
        {icon}
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-center">{name}</span>
    </div>
  )
}
