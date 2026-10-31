import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import RefreshIcon from '@mui/icons-material/Refresh'
import HistoryIcon from '@mui/icons-material/HistoryRounded'
import { api, ApiError, type RunRecord, type RunSummary, type SessionDetail, type SessionListItem, type SpecSummary } from '../lib/api'
import { fmtDate, fmtDuration, runStatusColor, runStatusLabel } from '../theme'
import RunDialog from '../components/RunDialog'

/** Playground: conversación real con agentes (sesiones del runtime).
 *  Turnos ASÍNCRONOS: START → 202 {executionId} → polling del run hasta
 *  estado terminal. Ejecuciones CPU de 30-60 s en frío no bloquean la UI,
 *  no pierden la sesión si recargas, y el run queda en el historial. */

const POLL_INTERVAL_MS = 2200
const POLL_MAX_MS = 240000

interface ActiveRun {
  executionId: string
  startedAtMs: number
  input: string
}

export default function Playground(): ReactNode {
  const params = useParams<'sessionId'>()
  const [search] = useSearchParams()
  const navigate = useNavigate()

  /* Agentes registrados (público) */
  const [agents, setAgents] = useState<SpecSummary[]>([])
  useEffect(() => {
    api.specs.list().then((s) => setAgents(s.filter((x) => x.kind === 'Agent'))).catch(() => setAgents([]))
  }, [])

  /* Sesiones y detalle */
  const [sessions, setSessions] = useState<SessionListItem[]>([])
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

    /* Turno activo (polling) + runs abiertos del inspector */
  const [active, setActive] = useState<ActiveRun | null>(null)
  const [draft, setDraft] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [openRun, setOpenRun] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [recoverBanner, setRecoverBanner] = useState<string | null>(null)
  const [, setTick] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sessionId = params.sessionId ?? null
  const preselectAgent = search.get('agent')

  const refreshSessions = useCallback(() => {
    api.sessions().then(setSessions).catch(() => setSessions([]))
  }, [])

  const refreshSession = useCallback(async (): Promise<void> => {
    if (!sessionId) {
      return
    }
    try {
      setLoadError(null)
      setSession(await api.session(sessionId))
    } catch {
      setLoadError('La sesión no existe o el backend no la encuentra.')
      setSession(null)
    }
  }, [sessionId])

  useEffect(() => {
    refreshSessions()
    void refreshSession()
  }, [refreshSessions, refreshSession])

  /* Reanudar polling si el usuario RETOMA una sesión con un run 'running' */
  useEffect(() => {
    if (!session || active) {
      return
    }
    const running = session.runs.find((r) => r.status === 'running')
    if (running) {
      setRecoverBanner('Turno en curso detectado — conexión reanudada al polling.')
      setActive({ executionId: running.executionId, startedAtMs: Date.parse(running.startedAt), input: '' })
    }
  }, [session, active])

  /* Polling del turnover activo */
  useEffect(() => {
    if (!active) return
    const tick = async () => {
      try {
        let rec: RunRecord | null = null
        try {
          rec = await api.run(active.executionId)
        } catch (e) {
          if (e instanceof ApiError && e.status === 404) {
            setActive(null)
            setRecoverBanner(null)
            void refreshSession()
            return
          }
          throw e
        }
        if (rec.status !== 'running') {
          stopPolling()
          setActive(null)
          setRecoverBanner(null)
          void refreshSession()
          refreshSessions()
          setSession((s) =>
            s
              ? { ...s, runs: s.runs.some((r) => r.executionId === rec!.executionId) ? s.runs : [toSummary(rec!), ...s.runs] }
              : s,
          )
        } else if (Date.now() - active.startedAtMs > POLL_MAX_MS) {
          stopPolling()
          setActive(null)
          setSendError('La ejecución sigue corriendo en el runtime pero excede el tiempo de polling del navegador. Consulta el historial más tarde o recarga para reconectar.')
        }
      } catch {
        /* próximo intento */
      }
    }
    pollRef.current = setInterval(() => void tick(), POLL_INTERVAL_MS)
    void tick()
    return stopPolling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.executionId])

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => () => stopPolling(), [])

  useEffect(() => {
    if (!active) {
      return
    }
    // Re-render por segundo: el contador del chip "agente trabajando…" avanza.
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [active])

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [session?.messages.length, active !== null])

  const createSession = async () => {
    const agentId = preselectAgent && agents.some((a) => a.id === preselectAgent) ? preselectAgent : agents[0]?.id
    if (!agentId) {
      setSendError('No hay agentes registrados: crea primero un AgentSpec.')
      return
    }
    setCreating(true)
    setSendError(null)
    try {
      const s = await api.createSession(agentId)
      refreshSessions()
      navigate(`/playground/${s.sessionId}`)
    } catch (err) {
      setSendError(prettyError(err))
    } finally {
      setCreating(false)
    }
  }

  const send = async () => {
    if (!session || !draft.trim() || active) {
      return
    }
    const input = draft.trim()
    setDraft('')
    setSendError(null)
    try {
      const resp = await api.startRun(session.sessionId, input)
      setActive({ executionId: resp.executionId, startedAtMs: Date.now(), input })
      // Mensaje optimista del usuario; la fuente autoritativa es el refresco
      // de la sesión al terminar el turno (incluye mensajes de tool).
      setSession((s) =>
        s ? { ...s, messages: [...s.messages, { role: 'user' as const, content: input, at: new Date().toISOString() }] } : s,
      )
    } catch (err) {
      setSendError(prettyError(err))
      setDraft(input)
    }
  }

  const runList = useMemo(() => session?.runs ?? [], [session])
  const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? id

  if (agents.length === 0 && !creating) {
    return (
      <Stack spacing={2}>
        <Typography variant="h4">Playground</Typography>
        <Alert severity="info">Primero registra un AgentSpec en «Agentes» para poder conversar con él.</Alert>
        <Button sx={{ alignSelf: 'flex-start' }} onClick={() => navigate('/agents/new')} variant="contained">
          Crear agente
        </Button>
      </Stack>
    )
  }

  /* ── Panel sin sesión activa ── */
  if (!sessionId) {
    return (
      <Stack spacing={2.5} maxWidth={720}>
        <Typography variant="h4">Playground</Typography>
        <Typography color="text.secondary">
          Conversa con tus agentes: cada conversación es una sesión real del runtime (spec + perfil resuelto,
          herramientas autorizadas, límites activos).
        </Typography>
        <Card>
          <CardContent sx={{ p: 2.4 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Nuevo session
            </Typography>
            <Stack spacing={1.6}>
              {preselectAgent && (
                <Alert severity="info" onClose={() => navigate('/playground')}>
                  Agente preseleccionado: <code>{preselectAgent}</code>
                </Alert>
              )}
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => void createSession()} disabled={creating}>
                {creating ? 'Creando…' : `Crear sesión${preselectAgent ? ` (${preselectAgent})` : ''}`}
              </Button>
              {sendError && <Alert severity="error">{sendError}</Alert>}
            </Stack>
          </CardContent>
        </Card>
          <SessionList sessions={sessions} onSelect={(id) => navigate(`/playground/${id}`)} onReload={refreshSessions} />
      </Stack>
    )
  }

  /* ── Panel de sesión activa ── */
  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
        <Typography variant="h4">Playground</Typography>
        {session && (
          <>
            <Chip size="small" variant="outlined" label={`${agentName(session.agentSpecId)}`} />
            <Chip size="small" variant="outlined" label={`sesión ${session.sessionId}`} onClick={() => navigate('/playground')} sx={{ cursor: 'pointer' }} />
            <Chip size="small" variant="outlined" label={`perfil: ${session.profileId}`} />
            <Chip size="small" variant="outlined" label={`${session.messages.length} mensajes`} />
          </>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Refrescar historial">
          <IconButton onClick={() => void refreshSession()}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {recoverBanner && <Alert severity="warning" onClose={() => setRecoverBanner(null)}>{recoverBanner}</Alert>}
      {loadError && <Alert severity="error">{loadError}</Alert>}

      <Stack direction="row" spacing={2} sx={{ flex: 1, minHeight: 0, alignItems: 'stretch' }}>
        {/* Columna izquierda: sesiones */}
        <Box sx={{ width: 260, flexShrink: 0, display: { xs: 'none', lg: 'block' } }}>
          <SessionList sessions={sessions} activeId={sessionId} onSelect={(id) => navigate(`/playground/${id}`)} onReload={refreshSessions} onCreate={createSession} creating={creating} />
        </Box>

        {/* Conversación */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', p: 2.2, bgcolor: 'rgba(2,6,23,0.35)' }}>
              {!session && <LinearProgress />}
              {session && session.messages.length === 0 && (
                <Typography color="text.secondary" fontSize={14} sx={{ mt: 4, textAlign: 'center' }}>
                  Sesión creada contra <code>{session.agentSpecId}</code>. Escribe el primer mensaje y lanza un turno — el
                  agente usará su ModelProfile y las herramientas autorizadas de su spec.
                </Typography>
              )}
              {session?.messages.map((m, i) => (
                <MessageRow key={i} message={m} />
              ))}
              {active && session && (
                <Stack direction="row" spacing={1.4} sx={{ alignItems: 'center', mt: 2, mb: 1 }}>
                  <Chip
                    color="primary"
                    variant="status"
                    size="small"
                    label={`agente trabajando… (${fmtDuration(Date.now() - active.startedAtMs)})`}
                  />
                  <Typography fontSize={12.4} color="text.secondary">
                    turno <code>{active.executionId.slice(0, 12)}…</code> — sin bloqueo: puedes recargar y reconectar
                  </Typography>
                </Stack>
              )}
            </Box>
            <Box sx={{ p: 1.6, borderTop: 1, borderColor: 'divider' }}>
              {sendError && <Alert severity="error" sx={{ mb: 1.2 }}>{sendError}</Alert>}
              <Stack direction="row" spacing={1.2}>
                <TextField
                  fullWidth
                  placeholder={session ? `Mensaje para ${agentName(session.agentSpecId)}…` : 'Elige o crea una sesión'}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void send()
                    }
                  }}
                  disabled={!session || Boolean(active)}
                  multiline
                  maxRows={6}
                />
                <Button variant="contained" endIcon={<SendIcon />} onClick={() => void send()} disabled={!session || Boolean(active) || draft.trim().length === 0} sx={{ flexShrink: 0 }}>
                  Enviar
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Box>

        {/* Inspector de ejecuciones */}
        <Box sx={{ width: 300, flexShrink: 0, display: { xs: 'none', xl: 'block' } }}>
          <Card sx={{ height: '100%', overflowY: 'auto' }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" sx={{ alignItems: 'center', mb: 1.4 }}>
                <HistoryIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.8 }} />
                <Typography variant="h6" fontSize={15}>
                  Ejecuciones de la sesión
                </Typography>
              </Stack>
              {runList.length === 0 && <Typography color="text.secondary" fontSize={13.4}>Sin turnos todavía.</Typography>}
              <Stack spacing={1.1}>
                {runList.map((r) => (
                  <Box
                    key={r.executionId}
                    onClick={() => setOpenRun(r.executionId)}
                    sx={{ p: 1.2, border: 1, borderColor: 'divider', borderRadius: 2, cursor: 'pointer', bgcolor: 'rgba(124,140,255,0.04)', '&:hover': { borderColor: 'primary.main' } }}
                  >
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                      <Chip size="small" color={runStatusColor(r.status)} variant="status" label={runStatusLabel(r.status)} />
                      {r.toolCount > 0 && (
                        <Chip size="small" variant="outlined" label={`${r.toolCount} tools${r.toolFailures > 0 ? ` · ${r.toolFailures} rechazo${r.toolFailures > 1 ? 's' : ''}` : ''}`} />
                      )}
                    </Stack>
      <Typography fontSize={12} color="text.secondary" noWrap sx={{ mt: 0.5 }}>
                      {r.textPreview || (r.status === 'running' ? 'en curso…' : '')}
                    </Typography>
                    <Typography fontSize={11.4} color="text.secondary">
                      {fmtDuration(r.durationMs)} · {r.iterations} iter · {fmtDate(r.startedAt)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      <RunDialog executionId={openRun} onClose={() => setOpenRun(null)} />
    </Stack>
  )
}

/* ── Piezas ────────────────────────────────────────────────────────────────── */

function toSummary(rec: RunRecord): RunSummary {
  return {
    executionId: rec.executionId,
    sessionId: rec.sessionId,
    agentSpecId: rec.agentSpecId,
    status: rec.status,
    startedAt: rec.startedAt,
    finishedAt: rec.finishedAt,
    durationMs: rec.result.durationMs,
    iterations: rec.result.iterations,
    toolCount: rec.result.toolExecutions.length,
    toolFailures: rec.result.toolExecutions.filter((t) => !t.ok).length,
    textPreview: rec.result.text ?? '',
  }
}

function prettyError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 413) {
      return 'Entrada demasiado grande (límite del runtime).'
    }
    if (err.status === 404) {
      return 'La sesión o el agente no existen (el backend puede haberse reiniciado).'
    }
    return `Error ${err.status} del backend.`
  }
  return 'Fallo de red al hablar con el backend.'
}

function MessageRow({ message }: { message: SessionDetail['messages'][number] }): ReactNode {
  if (message.role === 'tool') {
    let parsed: unknown = message.content
    try {
      parsed = JSON.parse(message.content)
    } catch {
      /* texto plano */
    }
    const isError = typeof parsed === 'object' && parsed !== null && 'error' in (parsed as object)
    const okPayload = typeof parsed === 'object' && parsed !== null && 'ok' in (parsed as object) && (parsed as { ok?: boolean }).ok === true
    return (
      <Stack direction="row" justifyContent="center" sx={{ my: 1.4 }}>
        <Box sx={{ maxWidth: '86%' }}>
          <Stack direction="row" justifyContent="center" sx={{ mb: 0.4 }}>
            <Chip
              size="small"
              color={okPayload && !isError ? 'success' : 'error'}
              variant="status"
              label={`herramienta ${message.toolName ?? ''} ${okPayload && !isError ? '· resultado' : '· rechazada'}`}
            />
          </Stack>
          <Paper
            variant="outlined"
            component="pre"
            sx={{ p: 1.2, m: 0, fontSize: 11.8, bgcolor: 'rgba(2,6,23,0.5)', overflowX: 'auto', textAlign: 'left' }}
          >
            {typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)}
          </Paper>
        </Box>
      </Stack>
    )
  }
  const isUser = message.role === 'user'
  return (
    <Box sx={{ my: 1.5 }}>
      <Stack direction="row" justifyContent={isUser ? 'flex-end' : 'flex-start'}>
        <Paper
          variant="outlined"
          sx={{
            px: 1.7,
            py: 1.1,
            maxWidth: '78%',
            bgcolor: isUser ? 'rgba(124,140,255,0.14)' : 'rgba(47,191,113,0.08)',
            borderColor: isUser ? 'rgba(124,140,255,0.4)' : 'rgba(47,191,113,0.35)',
          }}
        >
          <Typography fontSize={14.2} whiteSpace="pre-wrap">
            {message.content}
          </Typography>
        </Paper>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isUser ? 'right' : 'left', mt: 0.3, px: 1 }}>
        {isUser ? 'tú' : 'agente'} · {fmtDate(message.at)}
      </Typography>
    </Box>
  )
}

function SessionList({
  sessions,
  activeId,
  onSelect,
  onReload,
  onCreate,
  creating,
}: {
  sessions: SessionListItem[]
  activeId?: string | null
  onSelect: (id: string) => void
  onReload: () => void
  onCreate?: () => void
  creating?: boolean
}): ReactNode {
  return (
    <Card>
      <CardContent sx={{ p: 1.6 }}>
        <Stack direction="row" sx={{ alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" fontSize={14.6}>
            Sesiones
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {onCreate && (
            <Button size="small" startIcon={<AddIcon />} onClick={onCreate} disabled={creating}>
              Nueva
            </Button>
          )}
          <IconButton size="small" onClick={onReload} title="Recargar">
            <RefreshIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
        {/* (sin estado de preselección persistente aquí) */}
        <Stack spacing={0.7}>
          {sessions.length === 0 && <Typography fontSize={12.6} color="text.secondary">Sin sesiones creadas.</Typography>}
          {sessions.map((s) => (
            <Box
              key={s.sessionId}
              onClick={() => onSelect(s.sessionId)}
              sx={{
                p: 1,
                borderRadius: 1.6,
                border: 1,
                borderColor: s.sessionId === activeId ? 'primary.main' : 'divider',
                cursor: 'pointer',
                bgcolor: s.sessionId === activeId ? 'rgba(124,140,255,0.11)' : 'transparent',
              }}
            >
              <Typography fontSize={12.6}>
                <code>{s.sessionId.slice(0, 14)}…</code>
              </Typography>
              <Typography fontSize={11.4} color="text.secondary" noWrap>
                {s.agentSpecId} · {s.messageCount} msg · {s.runCount} run{s.runCount === 1 ? '' : 's'}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
