'use client'

const ICONS: Record<string, { emoji: string; label: string }> = {
  cuna: { emoji: '🛏️', label: 'Cuna' },
  parque_infantil: { emoji: '🛝', label: 'Parque' },
  piscina: { emoji: '🏊', label: 'Piscina' },
  restaurante_ninos: { emoji: '🍽️', label: 'Menú infantil' },
  club_ninos: { emoji: '🎨', label: 'Kids Club' },
}

export function FamilyBadge({ amenities }: { amenities: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {amenities.map((a) => {
        const info = ICONS[a]
        if (!info) return null
        return (
          <span
            key={a}
            title={info.label}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wide"
            style={{
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#16a34a',
            }}
          >
            {info.emoji} {info.label}
          </span>
        )
      })}
    </div>
  )
}
