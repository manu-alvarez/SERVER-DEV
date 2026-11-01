import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Alert, Box, Button, Chip, Divider, LinearProgress, Stack, Tab, Tabs, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/RefreshRounded'
import { api, type ArtifactDetail, type ArtifactSummary, type GenerationRecord, type ProjectSummary } from '../../lib/api'
import { truncate } from '../../lib/engineering'
import { JsonBox, KV, Panel, SectionHeader, StateChip } from './shared'

/**
 * Registry (Misión 15) — artefactos registrados, versiones, procedencia y
 * ciclo de vida REALES (almacén data/engineering + registros de generación).
 */

function LifecycleHistory({ detail }: { detail: ArtifactDetail }): ReactNode {
  if (!detail.history?.length) {
    return <Typography variant="caption" color="text.secondary">sin transiciones registradas</Typography>
  }
  return (
    <Stack spacing={0.5}>
      {detail.history.map((h, i) => (
        <Typography key={i} variant="caption" color="text.secondary">
          {h.at.slice(0, 19).replace('T', ' ')} — {h.from} → <b>{h.to}</b> ({h.actor})
          {h.note ? ` — ${truncate(h.note, 70)}` : ''}
        </Typography>
      ))}
    </Stack>
  )
}

export default function Registry(): ReactNode {
  const [tab, setTab] = useState(0)
  const [artifacts, setArtifacts] = useState<ArtifactSummary[] | null>(null)
  const [projects, setProjects] = useState<ProjectSummary[] | []>([])
  const [generations, setGenerations] = useState<GenerationRecord[] | null>(null)
  const [detail, setDetail] = useState<ArtifactDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([api.eng.artifacts(), api.eng.projects().catch(() => [] as ProjectSummary[]), api.eng.generations(25).catch(() => ({ records: [] as GenerationRecord[] }))])
      .then(([a, p, g]) => {
        setArtifacts(a.artifacts)
        setProjects(Array.isArray(p) ? p : p.projects ?? [])
        setGenerations(g.records)
      })
      .catch(() => setError('No se pudo cargar el registro de ingeniería.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const openDetail = async (a: ArtifactSummary) => {
    setError(null)
    try {
      setDetail(await api.eng.artifact(a.kind, a.id))
    } catch {
      setError(`No se pudo cargar el detalle de ${a.id}.`)
    }
  }

  return (
    <Panel>
      <SectionHeader
        title="Registry de ingeniería"
        subtitle="Artefactos id@version con procedencia y ciclo de vida auditado; registros de generación con hashes."
        action={<RefreshIcon onClick={loading ? undefined : load} color={loading ? 'disabled' : 'primary'} sx={{ cursor: loading ? 'default' : 'pointer' }} />}
      />
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, minHeight: 36 }}>
        <Tab label={`Artefactos (${artifacts?.length ?? 0})`} />
        <Tab label={`Proyectos (${projects.length})`} />
        <Tab label={`Generaciones (${generations?.length ?? 0})`} />
      </Tabs>

      {tab === 0 && artifacts && (
        <Stack spacing={1}>
          {artifacts.length === 0 && <Typography variant="body2" color="text.secondary">Todavía no hay artefactos de ingeniería registrados.</Typography>}
          {artifacts.map((a) => (
            <Box key={`${a.kind}/${a.id}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
              <Button size="small" variant={detail && detail.kind === a.kind && detail.id === a.id ? 'contained' : 'text'} onClick={() => openDetail(a)} sx={{ fontFamily: 'ui-monospace, Menlo, monospace', justifyContent: 'flex-start' }}>
                {a.kind}/{a.id}
              </Button>
              <StateChip kind="lifecycle" state={a.lifecycle} />
              <Typography variant="caption" color="text.secondary">@{a.version}</Typography>
            </Box>
          ))}
          {detail && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={1}>
                <KV k="Documento" v={`${detail.kind}/${detail.id}@${detail.version}`} />
                <KV k="Ciclo de vida" v={<StateChip kind="lifecycle" state={detail.lifecycle} />} />
                <KV k="Versiones" v={detail.versions.map((v) => v.version).join(', ')} />
                <Typography variant="caption" color="text.secondary">Historial de transiciones:</Typography>
                <LifecycleHistory detail={detail} />
                <JsonBox data={detail.document} max={340} />
              </Stack>
            </>
          )}
        </Stack>
      )}

      {tab === 0 && artifacts === null && !loading && <Typography variant="body2" color="text.secondary">Cargando…</Typography>}

      {tab === 1 && (
        <Stack spacing={1}>
          {projects.length === 0 && <Typography variant="body2" color="text.secondary">Sin proyectos UES registrados todavía.</Typography>}
          {projects.map((p) => (
            <Stack key={p.id} direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>{p.id}</Typography>
              {p.version && <Typography variant="caption" color="text.secondary">@{p.version}</Typography>}
              {p.artifacts !== undefined && <Chip size="small" label={`${p.artifacts} artefactos`} variant="outlined" sx={{ fontSize: 11 }} />}
              <StateChip kind="lifecycle" state={p.lifecycle} />
            </Stack>
          ))}
        </Stack>
      )}

      {tab === 2 && generations && (
        <Stack spacing={1}>
          {generations.length === 0 && <Typography variant="body2" color="text.secondary">Sin generaciones registradas.</Typography>}
          {generations.map((g) => (
            <Box key={g.id} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>{g.id}</Typography>
                <Chip size="small" label={g.type} variant="outlined" sx={{ fontSize: 11 }} />
                <Chip size="small" label={g.status} color={g.status === 'succeeded' ? 'success' : 'error'} sx={{ fontSize: 11 }} />
                {g.outcome && (
                  <Typography variant="caption" color="text.secondary">
                    → {g.outcome.specKind ?? g.outcome.artifactKind} {g.outcome.id}@{g.outcome.version}{g.outcome.store === 'specs' ? ' (ejecutable)' : ''}
                  </Typography>
                )}
                <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                  {g.durationMs} ms
                </Typography>
              </Stack>
              {g.warnings && g.warnings.length > 0 && (
                <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                  {g.warnings[0]}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Panel>
  )
}
