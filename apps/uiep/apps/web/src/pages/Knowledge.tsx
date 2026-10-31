import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import IngestIcon from '@mui/icons-material/CloudUploadRounded'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import SearchIcon from '@mui/icons-material/SearchRounded'
import RefreshIcon from '@mui/icons-material/Refresh'
import { api, type KnowledgeHit, type KnowledgeSource, type SpecSummary } from '../lib/api'
import { fmtDate } from '../theme'

/**
 * Knowledge (Fase 5): fuentes documentales con ingesta REAL (embeddings del
 * proveedor configurado), consulta semántica con referencias trazables y
 * autorización por agente (deny-by-default). La memoria de sesión vive en el
 * Playground — Knowledge y Memory están separados por diseño.
 */

const statusColor = (s: KnowledgeSource['status']) =>
  s === 'ingested' ? 'success' : s === 'failed' ? 'error' : s === 'ingesting' ? 'primary' : 'default'

export default function Knowledge(): ReactNode {
  const [sources, setSources] = useState<KnowledgeSource[] | null>(null)
  const [agents, setAgents] = useState<SpecSummary[]>([])
  const [bindings, setBindings] = useState<Record<string, string[]>>({})

  /* Alta de fuente */
  const [type, setType] = useState<'text' | 'url'>('text')
  const [title, setTitle] = useState('')
  const [ref, setRef] = useState('')
  const [text, setText] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  /* Consulta */
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<KnowledgeHit[] | null>(null)
  const [querying, setQuerying] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)

  const load = useCallback(() => {
    api.knowledge.sources().then(setSources).catch(() => setSources([]))
    api.knowledge.bindings().then(setBindings).catch(() => setBindings({}))
  }, [])

  useEffect(() => {
    load()
    api.specs.list().then((all) => setAgents(all.filter((s) => s.kind === 'Agent'))).catch(() => setAgents([]))
  }, [load])

  const create = async () => {
    setFormError(null)
    setCreating(true)
    try {
      await api.knowledge.create({ type, title: title.trim() || undefined, ref: type === 'url' ? ref.trim() : undefined, text: type === 'text' ? text : undefined })
      setType('text'); setTitle(''); setRef(''); setText('')
      load()
    } catch (err) {
      setFormError(pretty(err))
    } finally {
      setCreating(false)
    }
  }

  const ingest = async (sourceId: string) => {
    setSources((ss) => ss?.map((s) => (s.sourceId === sourceId ? { ...s, status: 'ingesting' } : s)) ?? ss)
    try {
      await api.knowledge.ingest(sourceId)
    } catch (err) {
      setFormError(`Ingesta fallida: ${pretty(err)}`)
    }
    load()
  }

  const remove = async (sourceId: string) => {
    try {
      await api.knowledge.remove(sourceId)
    } catch (err) {
      setFormError(`Borrado fallido: ${pretty(err)}`)
    }
    load()
  }

  const runQuery = async () => {
    setQuerying(true)
    setQueryError(null)
    try {
      const r = await api.knowledge.query(query.trim())
      setHits(r.hits)
    } catch (err) {
      setQueryError(pretty(err))
      setHits(null)
    } finally {
      setQuerying(false)
    }
  }

  /** Toggle de autorización agente↔fuente: recompone el array del agente. */
  const toggleBinding = async (agentId: string, sourceId: string) => {
    const current = bindings[agentId] ?? []
    const next = current.includes(sourceId) ? current.filter((id) => id !== sourceId) : [...current, sourceId]
    // Optimista + autoritativo en el refresco
    setBindings((b) => ({ ...b, [agentId]: next }))
    try {
      await api.knowledge.setBindings(agentId, next)
    } catch (err) {
      setFormError(`No se pudo actualizar la autorización: ${pretty(err)}`)
      load()
    }
  }

  const boundAgentsOf = useMemo(
    () => (sourceId: string) => agents.filter((a) => (bindings[a.id] ?? []).includes(sourceId)),
    [agents, bindings],
  )

  return (
    <Stack spacing={2.6}>
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <Typography variant="h4">Conocimiento</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Recargar">
          <IconButton onClick={load}><RefreshIcon /></IconButton>
        </Tooltip>
      </Stack>
      <Typography color="text.secondary" fontSize={14.6} maxWidth={860}>
        Fuentes documentales con ingesta real (embeddings del proveedor configurado) y consulta semántica
        con referencias trazables. Los agentes solo acceden a las fuentes que les autorizas —
        <strong> deny-by-default</strong>. Knowledge (documentos) y Memory (interacciones) están separados.
      </Typography>

      {formError && <Alert severity="error" onClose={() => setFormError(null)}>{formError}</Alert>}

      {/* Alta de fuente */}
      <Card>
        <CardContent sx={{ p: 2.4, '&:last-child': { pb: 2.4 } }}>
          <Stack direction="row" sx={{ alignItems: 'center', mb: 1.6 }}>
            <Typography variant="h6">Nueva fuente</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <TextField select size="small" label="tipo" value={type} onChange={(e) => setType(e.target.value as 'text' | 'url')} sx={{ width: 110 }}>
              <MenuItem value="text">texto</MenuItem>
              <MenuItem value="url">url</MenuItem>
            </TextField>
          </Stack>
          <Stack spacing={1.6}>
            <TextField label="título" value={title} onChange={(e) => setTitle(e.target.value)} size="small" sx={{ maxWidth: 420 }} />
            {type === 'url' ? (
              <TextField
                label="URL"
                placeholder="https://…"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                size="small"
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><AddIcon sx={{ fontSize: 16, opacity: 0 }} /></InputAdornment> } }}
              />
            ) : (
              <TextField
                label="contenido (se persiste en la creación; ingesta idempotente por hash)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                multiline
                minRows={4}
                maxRows={12}
              />
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => void create()}
              disabled={creating || (type === 'url' ? ref.trim().length < 8 : text.trim().length < 20)}
              sx={{ alignSelf: 'flex-start' }}
            >
              {creating ? 'Creando…' : 'Crear fuente'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Consulta */}
      <Card>
        <CardContent sx={{ p: 2.4, '&:last-child': { pb: 2.4 } }}>
          <Typography variant="h6" sx={{ mb: 1.6 }}>Consulta semántica</Typography>
          <Stack direction="row" spacing={1.2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Pregunta sobre el contenido de tus fuentes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && query.trim() && void runQuery()}
            />
            <Button variant="contained" startIcon={<SearchIcon />} onClick={() => void runQuery()} disabled={querying || !query.trim()}>
              {querying ? 'Buscando…' : 'Buscar'}
            </Button>
          </Stack>
          {queryError && <Alert severity="error" sx={{ mt: 1.4 }}>{queryError}</Alert>}
          {hits && (
            <Stack spacing={1.2} sx={{ mt: 2 }}>
              {hits.length === 0 && <Typography color="text.secondary" fontSize={14}>Sin resultados por encima del umbral de similitud.</Typography>}
              {hits.map((h, i) => (
                <Box key={`${h.sourceId}-${h.chunkIdx}`} sx={{ p: 1.2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'rgba(124,140,255,0.05)' }}>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.6 }}>
                    <Chip size="small" color="primary" variant="status" label={`[${i + 1}]`} />
                    <Typography fontSize={13.6} fontWeight={600}>{h.title}</Typography>
                    <Chip size="small" variant="outlined" label={`fragmento #${h.chunkIdx}`} />
                    <Chip size="small" variant="outlined" label={`similitud ${h.score}`} />
                    <Box sx={{ flexGrow: 1 }} />
                    {h.ref && <Typography variant="caption" color="text.secondary" noWrap maxWidth={220}>{h.ref}</Typography>}
                  </Stack>
                  <Typography fontSize={13.2} sx={{ whiteSpace: 'pre-wrap' }}>{h.text.slice(0, 420)}{h.text.length > 420 ? '…' : ''}</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Listado de fuentes */}
      <Typography variant="h6" sx={{ mt: 1 }}>Fuentes ({sources?.length ?? 0})</Typography>
      {sources === null && <LinearProgress />}
      {sources?.length === 0 && <Alert severity="info">Aún no hay fuentes. Crea la primera arriba.</Alert>}
      <Stack spacing={1.6}>
        {sources?.map((s) => {
          const bound = boundAgentsOf(s.sourceId)
          return (
            <Card key={s.sourceId}>
              <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                  <Typography variant="h6" fontSize={16}>{s.title}</Typography>
                  <code style={{ opacity: 0.65, fontSize: 12 }}>{s.sourceId}</code>
                  <Chip size="small" variant="outlined" label={s.type} />
                  <Chip size="small" color={statusColor(s.status)} variant="status" label={s.status.toUpperCase()} />
                  {s.status === 'ingested' && <Chip size="small" variant="outlined" label={`${s.chunkCount} fragmentos · ${s.dims ?? '?'} dims`} />}
                  <Box sx={{ flexGrow: 1 }} />
                  <Button size="small" startIcon={<IngestIcon />} onClick={() => void ingest(s.sourceId)} disabled={s.status === 'ingesting'}>
                    {s.status === 'ingested' ? 'Reingestar' : 'Ingerir'}
                  </Button>
                  <IconButton size="small" onClick={() => void remove(s.sourceId)} title="Eliminar fuente"><DeleteIcon /></IconButton>
                </Stack>
                {s.ref && <Typography variant="caption" color="text.secondary" display="block" noWrap>{s.ref}</Typography>}
                {s.error && <Alert severity="error" sx={{ mt: 1 }}>{s.error}</Alert>}
                <Stack direction="row" sx={{ alignItems: 'center', gap: 0.8, flexWrap: 'wrap', mt: 1.2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 0.6 }}>AUTORIZADA A:</Typography>
                  {agents.length === 0 && <Typography variant="caption" color="text.secondary">sin agentes registrados</Typography>}
                  {agents.map((a) => {
                    const on = bound.some((b) => b.id === a.id)
                    return (
                      <Chip
                        key={a.id}
                        size="small"
                        clickable
                        color={on ? 'success' : 'default'}
                        variant={on ? 'status' : 'outlined'}
                        label={`${a.id} ${on ? '✓' : ''}`}
                        onClick={() => void toggleBinding(a.id, s.sourceId)}
                      />
                    )
                  })}
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.8 }}>
                  creada {fmtDate(s.createdAt)}{s.ingestedAt ? ` · ingerida ${fmtDate(s.ingestedAt)}` : ''}
                </Typography>
              </CardContent>
            </Card>
          )
        })}
      </Stack>
    </Stack>
  )
}

function pretty(err: unknown): string {
  const anyErr = err as { status?: number; payload?: { message?: string; error?: string } }
  if (anyErr?.status !== undefined) {
    return `Error ${anyErr.status}${anyErr.payload?.message ? ': ' + anyErr.payload.message : ''}`
  }
  return 'Fallo de red.'
}
