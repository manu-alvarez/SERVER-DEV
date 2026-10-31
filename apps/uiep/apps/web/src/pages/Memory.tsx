import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, IconButton, LinearProgress, Stack, TextField, Tooltip, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import RefreshIcon from '@mui/icons-material/Refresh'
import { api, type MemoryRecord } from '../lib/api'
import { fmtDate, fmtDuration } from '../theme'

/**
 * Memory (Fase 5.1): recuerdos DERIVADOS de interacciones (agente/sesión),
 * escritos SOLO por la tool cerrada memory-write con políticas deterministas
 * (dedup, TTL, cuota). Gestión del operador: consultar y eliminar. Knowledge
 * (documentos) está en su propia página — separación por diseño.
 */

export default function MemoryPage(): ReactNode {
  const [memories, setMemories] = useState<MemoryRecord[] | null>(null)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api.memory.list().then(setMemories).catch(() => setMemories([]))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const agents = useMemo(() => [...new Set((memories ?? []).map((m) => m.agentSpecId))], [memories])
  const filtered = useMemo(() => {
    const list = memories ?? []
    if (!filter.trim()) return list
    const f = filter.trim().toLowerCase()
    return list.filter((m) => m.agentSpecId.toLowerCase().includes(f) || m.content.toLowerCase().includes(f) || (m.sessionId ?? '').includes(f))
  }, [memories, filter])

  const remove = async (memoryId: string) => {
    setError(null)
    try {
      await api.memory.remove(memoryId)
    } catch {
      setError('No se pudo eliminar el recuerdo.')
    }
    load()
  }

  return (
    <Stack spacing={2.6}>
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <Typography variant="h4">Memoria</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Recargar">
          <IconButton onClick={load}><RefreshIcon /></IconButton>
        </Tooltip>
      </Stack>
      <Typography color="text.secondary" fontSize={14.6} maxWidth={860}>
        Recuerdos derivados de interacciones, escritos únicamente por la herramienta cerrada
        <code> memory-write</code> con políticas deterministas (deduplicación por hash, TTL, cuota por agente).
        La memoria de agente se recupera por similitud en cada turno; la de sesión por recencia. Eliminar aquí
        es inmediato e irreversible.
      </Typography>

      <Box sx={{ maxWidth: 480 }}>
        <TextField label="Filtrar por agente, contenido o sesión" value={filter} onChange={(e) => setFilter(e.target.value)} size="small" fullWidth />
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {memories === null && <LinearProgress sx={{ borderRadius: 2 }} />}

      {memories !== null && (
        <>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {agents.map((a) => (
              <Chip key={a} size="small" variant="outlined" label={`${a} · ${(memories ?? []).filter((m) => m.agentSpecId === a && m.status === 'active' && !m.expired).length} activos`} />
            ))}
            {agents.length === 0 && <Typography color="text.secondary" fontSize={14}>Sin recuerdos todavía — un agente con memoria escribe cuando su turno lo justifica.</Typography>}
          </Stack>

          <Stack spacing={1.4}>
            {filtered.map((m) => {
              const inactive = m.status !== 'active' || m.expired
              return (
                <Card key={m.memoryId} sx={{ opacity: inactive ? 0.55 : 1 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.6 }}>
                      <Chip size="small" color={m.kind === 'agent' ? 'primary' : 'secondary'} variant="status" label={m.kind === 'agent' ? 'AGENTE' : 'SESIÓN'} />
                      {m.expired && <Chip size="small" color="warning" variant="status" label="caducado" />}
                      {m.status !== 'active' && <Chip size="small" color="default" variant="status" label={m.status} />}
                      <code style={{ opacity: 0.65, fontSize: 11.5 }}>{m.memoryId}</code>
                      <Box sx={{ flexGrow: 1 }} />
                      <IconButton size="small" onClick={() => void remove(m.memoryId)} title="Eliminar recuerdo" disabled={m.status !== 'active'}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Typography fontSize={14} sx={{ whiteSpace: 'pre-wrap' }}>{m.content}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.6 }}>
                      agente <code>{m.agentSpecId}</code> · {m.sessionId ? <>sesión <code>{m.sessionId.slice(0, 14)}…</code> · </> : null}
                      origen <code>{m.origin.executionId.slice(0, 16)}…</code> · creado {fmtDate(m.createdAt)} · caduca {fmtDate(m.expiresAt)} ({fmtDuration(Date.parse(m.expiresAt) - Date.now())})
                    </Typography>
                  </CardContent>
                </Card>
              )
            })}
            {filtered.length === 0 && memories.length > 0 && <Alert severity="info">Ningún recuerdo coincide con el filtro.</Alert>}
          </Stack>
        </>
      )}

      <Button sx={{ alignSelf: 'flex-start' }} startIcon={<RefreshIcon />} onClick={load}>
        Recargar
      </Button>
    </Stack>
  )
}
