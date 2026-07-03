'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { MEQUINENZA } from './constants'
import type { AIDestination } from '@/lib/family-travel/aiOrchestrator'

const MapContent = dynamic(
  () => import('./DestinationMapInner'),
  { ssr: false, loading: () => <div className="skeleton rounded-2xl h-80 w-full" /> },
)

interface Props {
  destinations: AIDestination[]
  selectedId?: string | null
  onSelect?: (dest: AIDestination) => void
}

export function DestinationMap(props: Props) {
  return <MapContent {...props} />
}
