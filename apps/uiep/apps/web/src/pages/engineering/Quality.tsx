import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Alert, Button, Checkbox, FormControl, FormControlLabel, InputLabel, LinearProgress, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import CheckIcon from '@mui/icons-material/VerifiedOutlined'
import { api, type ArtifactSummary, type ProjectSummary, type QualityReport } from '../../lib/api'
import { JsonBox, Panel, SectionHeader, StateChip } from './shared'

/**
 * Quality Center (Misión 15) — evaluaciones REALES vía Quality Engine:
 * informe en 4 dimensiones (schema/referencias/seguridad/comportamiento)
 * por artefacto, y calidad por lotes de un proyecto UES completo.
 */

export default function Quality(): ReactNode {
  const [artifacts, setArtifacts] = useState<ArtifactSummary[]>([])
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [kind, setKind] = useState('')
  const [id, setId] = useState('')
  const [behavior, setBehavior] = useState(true)
  const [agentSpecId, setAgentSpecId] = useState('')
  const [report, setReport] = useState<QualityReport | null>(null)
  const [projectReport, setProjectReport] = useState<Array<QualityReport | { artifact: string; error: string }> | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api.eng
      .artifacts()
      .then((r) => setArtifacts(r.artifacts))
      .catch(() => setArtifacts([]))
    api.eng
      .projects()
      .then((r) => setProjects(Array.isArray(r) ? r : r.projects ?? []))
      .catch(() => setProjects([]))
  }, [])

  useEffect(load, [load])

  const runQuality = async () => {
    setBusy(true)
    setError(null)
    setReport(null)
    setProjectReport(null)
    try {
      setReport(
        await api.eng.quality(kind, id, behavior && agentSpecId ? { agentSpecId, timeoutMs: 300000 } : undefined),
      )
    } catch (e) {
      const payload = (e as { payload?: unknown }).payload
      setError(JSON.stringify(payload ?? (e as Error).message).slice(0, 300))
    } finally {
      setBusy(false)
    }
  }

  const runProjectQuality = async (projectId: string) => {
    setBusy(true)
    setError(null)
    setReport(null)
    setProjectReport(null)
    try {
      const r = await api.eng.projectQuality(projectId, behavior)
      setProjectReport(r.reports)
    } catch (e) {
      const payload = (e as { payload?: unknown }).payload
      setError(JSON.stringify(payload ?? (e as Error).message).slice(0, 300))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel>
      <SectionHeader
        title="Quality Center"
        subtitle="Evaluación REAL: schema + referencias + seguridad del documento + comportamiento ejecutado en el sandbox."
      />
      {busy && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' }, mb: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 320 }}>
          <InputLabel id="q-artifact-label">Artefacto</InputLabel>
          <Select
            labelId="q-artifact-label"
            label="Artefacto"
            value={`${kind}|${id}`}
            onChange={(e) => {
              const [k, i] = (e.target.value as string).split('|')
              setKind(k)
              setId(i)
            }}
            MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
          >
            {artifacts.length === 0 && (
              <MenuItem value="|">— sin artefactos —</MenuItem>
            )}
            {artifacts.map((a) => (
              <MenuItem key={`${a.kind}/${a.id}`} value={`${a.kind}|${a.id}`}>
                {a.kind}/{a.id} @{a.version} ({a.lifecycle})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Checkbox checked={behavior} onChange={(e) => setBehavior(e.target.checked)} />}
          label="incluir comportamiento (ejecución en sandbox)"
        />
        {behavior && (
          <TextField size="small" label="agentSpecId para el behavior" value={agentSpecId} onChange={(e) => setAgentSpecId(e.target.value)} sx={{ maxWidth: 220 }} slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace' } } }} />
        )}
        <Button variant="contained" startIcon={<CheckIcon />} disabled={busy || !kind || !id} onClick={runQuality}>
          Evaluar
        </Button>
      </Stack>

      {report && (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          <Alert severity={report.verdict === 'pass' ? 'success' : 'error'}>
            Veredicto: <b>{report.verdict.toUpperCase()}</b> — {report.artifact.kind}/{report.artifact.id}@{report.artifact.version}
          </Alert>
          {report.checks.map((c) => (
            <Stack key={c.dimension} direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} sx={{ alignItems: { sm: 'center' } }}>
              <StateChip kind="execution" state={c.passed ? 'succeeded' : 'failed'} />
              <Typography variant="body2" sx={{ minWidth: 110, fontWeight: 600 }}>{c.dimension}</Typography>
              <JsonBox data={c.detail} max={130} />
            </Stack>
          ))}
        </Stack>
      )}

      {projectReport && (
        <Stack spacing={1}>
          <Typography variant="subtitle2">Calidad del proyecto:</Typography>
          {projectReport.map((r) =>
            'verdict' in r ? (
              <Alert key={r.artifact.kind + r.artifact.id} severity={r.verdict === 'pass' ? 'success' : 'error'}>
                {r.artifact.kind}/{r.artifact.id} → {r.verdict}
              </Alert>
            ) : (
              <Alert key={r.artifact} severity="warning">
                {r.artifact}: {r.error}
              </Alert>
            ),
          )}
        </Stack>
      )}

      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
        Por proyecto completo:
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {projects.map((p) => (
          <Button key={p.id} size="small" variant="outlined" disabled={busy || behavior} onClick={() => runProjectQuality(p.id)}>
            {p.id}
          </Button>
        ))}
      </Stack>
      {behavior && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          La calidad por proyecto es ESTÁTICA (sin behavior) — para ejecutar comportamientos usa la evaluación individual con agentSpecId.
        </Typography>
      )}
    </Panel>
  )
}
