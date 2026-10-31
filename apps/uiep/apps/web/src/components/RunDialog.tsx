import { useEffect, useState, type ReactNode } from 'react'
import Grid2 from '@mui/material/Grid2'
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/FileDownloadOutlined'
import { api, type RunRecord } from '../lib/api'
import { fmtDate, fmtDuration, runStatusColor, runStatusLabel } from '../theme'

/** Inspector de una ejecución: entrada, herramienta calls con resultados,
 * errores, iteraciones/tiempo y respuesta final del agente. */

function JsonBox({ data }: { data: unknown }): ReactNode {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 1.2,
        borderRadius: 1.4,
        bgcolor: 'rgba(2,6,23,0.66)',
        border: 1,
        borderColor: 'divider',
        fontSize: 12.2,
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
    </Box>
  )
}

export default function RunDialog({ executionId, onClose }: { executionId: string | null; onClose: () => void }): ReactNode {
  const [run, setRun] = useState<RunRecord | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!executionId) {
      return
    }
    let alive = true
    setError(null)
    api
      .run(executionId)
      .then((r) => alive && setRun(r))
      .catch((e) => alive && setError(String((e as ApiErrorLike).message ?? 'fallo al cargar la ejecución')))
    return () => {
      alive = false
    }
  }, [executionId])

  const download = () => {
    if (!run) {
      return
    }
    const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${run.executionId}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <Dialog open={executionId !== null} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ flexGrow: 1, mr: 1 }} fontSize={16} fontWeight={600}>
          Ejecución <code>{executionId}</code>
        </Typography>
        <IconButton onClick={download} title="Descargar JSON" size="small" disabled={!run}>
          <DownloadIcon />
        </IconButton>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error">{error}</Alert>}
        {!run && !error && <Typography color="text.secondary">Cargando…</Typography>}
        {run && (
          <Stack spacing={2.4}>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Chip size="small" color={runStatusColor(run.status)} variant="status" label={runStatusLabel(run.status)} />
              <Chip size="small" variant="outlined" label={`agente: ${run.agentSpecId}`} />
              <Chip size="small" variant="outlined" label={`modelo: ${run.profileUsed.model || '—'}`} />
              <Chip size="small" variant="outlined" label={`${run.result.iterations} iteraciones`} />
              <Chip size="small" variant="outlined" label={fmtDuration(run.result.durationMs)} />
            </Stack>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Entrada del usuario
              </Typography>
              <JsonBox data={run.input} />
            </Box>

            {run.result.toolExecutions.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Llamadas a herramientas
                </Typography>
                <Stack spacing={1}>
                  {run.result.toolExecutions.map((t, i) => (
                    <Box key={i} sx={{ p: 1.2, borderRadius: 1.4, border: 1, borderColor: 'divider', bgcolor: 'rgba(124,140,255,0.05)' }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: t.ok ? 0.8 : 0.4 }}>
                        <Chip size="small" label={t.name} color="secondary" variant="outlined" sx={{ fontWeight: 700 }} />
                        {t.ok ? (
                          <Chip size="small" color="success" variant="status" label="ejecutada" />
                        ) : (
                          <Chip size="small" color="error" variant="status" label={`rechazada: ${t.error ?? 'error'}`} />
                        )}
                      </Stack>
                      {!t.ok ? <JsonBox data={t.error ?? 'error'} /> : <JsonBox data={t.result} />}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {run.result.retrievals && run.result.retrievals.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Conocimiento inyectado (trazabilidad → fuente)
                </Typography>
                <Stack spacing={0.8}>
                  {run.result.retrievals.map((r, i) => (
                    <Stack key={i} direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip size="small" color="primary" variant="status" label={`[${i + 1}]`} />
                      <Typography fontSize={13.4}>{r.title}</Typography>
                      <Chip size="small" variant="outlined" label={`fragmento #${r.chunkIdx}`} />
                      <Chip size="small" variant="outlined" label={`similitud ${r.score}`} />
                      <Chip size="small" variant="outlined" label={`src ${r.sourceId}`} />
                      {r.ref && <Typography variant="caption" color="text.secondary" noWrap maxWidth={240}>{r.ref}</Typography>}
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}

            {run.result.text && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Respuesta final del agente
                </Typography>
                <Box sx={{ p: 1.4, borderRadius: 1.4, border: 1, borderColor: 'divider', bgcolor: 'rgba(47,191,113,0.06)' }}>
                  <Typography fontSize={14.4} whiteSpace="pre-wrap">
                    {run.result.text}
                  </Typography>
                </Box>
              </Box>
            )}

            {run.errors.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Errores registrados
                </Typography>
                {run.errors.map((e, i) => (
                  <Alert key={i} severity="error" sx={{ mb: 0.6 }}>
                    <code>{e}</code>
                  </Alert>
                ))}
              </Box>
            )}

            <Grid2 container>
              <Typography variant="caption" color="text.secondary">
                {fmtDate(run.startedAt)} → {run.finishedAt ? fmtDate(run.finishedAt) : 'en curso'} · endpoint {run.profileUsed.endpoint || '—'}
              </Typography>
            </Grid2>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}

type ApiErrorLike = { message?: string }
