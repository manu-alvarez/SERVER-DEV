import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Alert, Button, LinearProgress, MenuItem, Stack, TextField, Typography } from '@mui/material'
import DownloadIcon from '@mui/icons-material/DownloadRounded'
import RefreshIcon from '@mui/icons-material/RefreshRounded'
import { api, type ArtifactSummary, type ExportResult, type ProjectSummary } from '../../lib/api'
import { downloadJson, truncate } from '../../lib/engineering'
import { KV, Panel, SectionHeader } from './shared'

/**
 * Export Center (Misión 15) — exportación estructurada REAL (uiep-export-v1):
 * proyectos, artefactos y registros de generación → bundle JSON reinstalable
 * con README, hash y sin secretos. La descarga es el MISMO bundle que queda
 * en data/engineering/exports del VPS.
 */

type Target = { mode: 'project' | 'artifact' | 'generation'; ref: string }

export default function Exports(): ReactNode {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [artifacts, setArtifacts] = useState<ArtifactSummary[]>([])
  const [target, setTarget] = useState<Target>({ mode: 'project', ref: '' })
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ExportResult | null>(null)
  const [files, setFiles] = useState<Array<{ filename: string; sizeBytes: number; createdAt: string }>>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api.eng
      .projects()
      .then((r) => setProjects(Array.isArray(r) ? r : r.projects ?? []))
      .catch(() => setProjects([]))
    api.eng
      .artifacts()
      .then((r) => setArtifacts(r.artifacts))
      .catch(() => setArtifacts([]))
    api.eng
      .exports()
      .then((r) => setFiles(r.files))
      .catch(() => setFiles([]))
  }, [])

  useEffect(load, [load])

  const doExport = async () => {
    if (!target.ref) {
      return
    }
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const r =
        target.mode === 'project'
          ? await api.eng.exportProject(target.ref)
          : target.mode === 'artifact'
            ? await api.eng.exportArtifact(...(target.ref.split('/') as [string, string]))
            : await api.eng.exportGeneration(target.ref)
      setResult(r)
      load()
    } catch (e) {
      const payload = (e as { payload?: unknown }).payload
      setError(JSON.stringify(payload ?? (e as Error).message).slice(0, 250))
    } finally {
      setBusy(false)
    }
  }

  const options: Array<{ value: string; label: string }> = [
    ...projects.map((p) => ({ value: `project:${p.id}`, label: `Proyecto: ${p.id}` })),
    ...artifacts.map((a) => ({ value: `artifact:${a.kind}/${a.id}`, label: `Artefacto: ${a.kind}/${a.id}` })),
  ]

  return (
    <Panel>
      <SectionHeader
        title="Export Center"
        subtitle="Bundles uiep-export-v1: JSON reinstalable con README, hash SHA-256 y sin secretos."
        action={<RefreshIcon onClick={load} color="primary" sx={{ cursor: 'pointer' }} />}
      />
      {busy && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' }, mb: 2 }}>
        <TextField
          size="small"
          select
          label="Qué exportar"
          value={target.mode === 'generation' ? 'generation:' : `${target.mode}:${target.ref}`}
          onChange={(e) => {
            const v = e.target.value
            if (v === 'generation:') {
              setTarget({ mode: 'generation', ref: '' })
              return
            }
            const [mode, ref] = v.split(':')
            setTarget({ mode: mode as Target['mode'], ref: ref ?? '' })
          }}
          sx={{ minWidth: 340 }}
          SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 320 } } } }}
        >
          {options.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
          <MenuItem value="generation:">Registro de generación (por id)…</MenuItem>
        </TextField>
        {target.mode === 'generation' && (
          <TextField
            size="small"
            label="id de generación (gen-…)"
            value={target.ref}
            onChange={(e) => setTarget({ ...target, ref: e.target.value })}
            slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace' } } }}
          />
        )}
        <Button variant="contained" startIcon={<DownloadIcon />} disabled={busy || !target.ref || (target.mode === 'generation' && !target.ref.startsWith('gen-'))} onClick={doExport}>
          {busy ? 'Exportando…' : 'Exportar'}
        </Button>
      </Stack>

      {result && (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          <Alert severity="success">
            Exportado: <b>{result.filename}</b>
          </Alert>
          <KV k="Formato" v={result.format} />
          <KV k="Documentos" v={`${result.documents.length} (${result.documents.map((d) => truncate(d, 44)).join(', ')})`} />
          <KV k="Tamaño" v={`${result.sizeBytes} bytes`} />
          <KV k="SHA-256" v={result.sha256.slice(0, 32) + '…'} />
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={async () => {
              try {
                const bundle = await api.eng.exportFile(result.filename)
                downloadJson(bundle, result.filename)
              } catch {
                setError('No se pudo descargar el bundle (¿se eliminó del servidor?).')
              }
            }}
          >
            Descargar bundle completo
          </Button>
        </Stack>
      )}

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Bundles generados en el servidor (data/engineering/exports):
      </Typography>
      <Stack spacing={0.8}>
        {files.length === 0 && <Typography variant="body2" color="text.secondary">Sin exportaciones todavía.</Typography>}
        {files.map((f) => (
          <Stack key={f.filename} direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.3, sm: 2 }} sx={{ alignItems: { sm: 'center' } }}>
            <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
              {f.filename}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {f.sizeBytes} bytes · {f.createdAt.slice(0, 19).replace('T', ' ')}
            </Typography>
            <Button
              size="small"
              variant="text"
              startIcon={<DownloadIcon />}
              onClick={async () => {
                try {
                  downloadJson(await api.eng.exportFile(f.filename), f.filename)
                } catch {
                  setError(`No se pudo descargar ${f.filename}.`)
                }
              }}
            >
              descargar
            </Button>
          </Stack>
        ))}
      </Stack>
    </Panel>
  )
}
