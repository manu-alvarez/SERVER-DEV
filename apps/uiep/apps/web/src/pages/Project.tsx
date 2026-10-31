import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, Divider, LinearProgress, Stack, TextField, Typography, Tooltip, IconButton } from '@mui/material'
import DownloadIcon from '@mui/icons-material/FileDownloadRounded'
import UploadIcon from '@mui/icons-material/FileUploadRounded'
import RefreshIcon from '@mui/icons-material/Refresh'
import ContentCopyIcon from '@mui/icons-material/ContentCopyRounded'
import HistoryIcon from '@mui/icons-material/HistoryRounded'
import InstallIcon from '@mui/icons-material/DownloadForOfflineRounded'
import { api, type SpecSummary } from '../lib/api'
import { fmtDate } from '../theme'

/**
 * Proyecto (Fase 9) — reproducibilidad: exportar el bundle completo de
 * contratos+knowledge e importarlo en OTRA instalación de UIEP; plantillas
 * (blueprints) instalables; clonado e historial de versiones de agentes.
 * La memoria se excluye del bundle por diseño (datos derivados privados).
 */

export default function Project(): ReactNode {
  const [, setSpecs] = useState<SpecSummary[] | null>(null)
  const [templates, setTemplates] = useState<Array<{ id: string; title: string; description: string; kind: string }> | null>(null)
  const [agents, setAgents] = useState<SpecSummary[]>([])
  const [versions, setVersions] = useState<Record<string, Array<{ version: string; createdAt: string | null }>>>({})
  const [cloneTarget, setCloneTarget] = useState<string | null>(null)
  const [cloneId, setCloneId] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    api.specs.list().then((all) => { setSpecs(all); setAgents(all.filter((s) => s.kind === 'Agent')) }).catch(() => setSpecs([]))
    api.templates.list().then(setTemplates).catch(() => setTemplates([]))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loadVersions = async (id: string) => {
    try {
      const r = await fetch(`/api/console/agents/${id}/versions`, { credentials: 'same-origin' })
      const docs = (await r.json()) as Array<{ version: string; createdAt: string | null }>
      setVersions((v) => ({ ...v, [id]: docs }))
    } catch {
      setError(`No se pudo cargar el historial de ${id}.`)
    }
  }

  const exportBundle = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch('/api/console/project', { credentials: 'same-origin' })
      if (!r.ok) throw new Error(String(r.status))
      const bundle = await r.json()
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `uiep-proyecto-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.json`
      a.click()
      URL.revokeObjectURL(a.href)
      setMessage('Proyecto exportado (contratos + knowledge — sin memoria por diseño).')
    } catch {
      setError('No se pudo exportar el proyecto.')
    } finally {
      setBusy(false)
    }
  }

  const importBundle = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const bundle = JSON.parse(await file.text())
      const r = await fetch('/api/console/project/import', { method: 'POST', headers: { 'content-type': 'application/json', 'x-uiep-console': '1' }, credentials: 'same-origin', body: JSON.stringify({ bundle }) })
      const body = (await r.json()) as { specsImported?: number; knowledgeImported?: number; errors?: string[] }
      if (!r.ok) throw new Error(body.errors?.join(', ') ?? String(r.status))
      setMessage(`Importado: ${body.specsImported} contratos · ${body.knowledgeImported} fuentes de conocimiento.`)
      load()
    } catch (err) {
      setError(`Import fallido: ${err instanceof Error ? err.message : 'error'}`)
    } finally {
      setBusy(false)
    }
  }

  const installTemplate = async (id: string) => {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(`/api/console/templates/${id}/install`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-uiep-console': '1' }, credentials: 'same-origin' })
      const body = (await r.json()) as { ok?: boolean; details?: string[]; reason?: string }
      if (!r.ok || !body.ok) throw new Error(body.reason ?? String(r.status))
      setMessage(`Plantilla '${id}' instalada: ${body.details?.join(', ')}`)
      load()
    } catch (err) {
      setError(`No se pudo instalar la plantilla: ${err instanceof Error ? err.message : 'error'}`)
    } finally {
      setBusy(false)
    }
  }

  const clone = async (id: string) => {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(`/api/console/agents/${id}/clone`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-uiep-console': '1' }, credentials: 'same-origin', body: JSON.stringify({ newId: cloneId.trim() }) })
      const body = (await r.json()) as { cloned?: boolean; error?: string }
      if (!r.ok || !body.cloned) throw new Error(body.error ?? String(r.status))
      setMessage(`Agente clonado → ${cloneId.trim()} (v1.0.0). Edítalo antes de usarlo.`)
      setCloneTarget(null)
      setCloneId('')
      load()
    } catch (err) {
      setError(`Clonado fallido: ${err instanceof Error ? err.message : 'error'}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack spacing={2.6}>
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <Typography variant="h4">Proyecto</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Recargar"><IconButton onClick={load}><RefreshIcon /></IconButton></Tooltip>
      </Stack>
      <Typography color="text.secondary" fontSize={14.6} maxWidth={860}>
        Reproducibilidad entre instalaciones: el bundle lleva los CONTRATOS (agentes,
        workflows, herramientas, integraciones) y el conocimiento documental con sus
        bindings. La memoria se excluye por diseño (datos derivados privados de cada
        instalación).
      </Typography>

      {message && <Alert severity="success" onClose={() => setMessage(null)}>{message}</Alert>}
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      {busy && <LinearProgress sx={{ borderRadius: 2 }} />}

      <Stack direction="row" spacing={1.6} sx={{ flexWrap: 'wrap' }}>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => void exportBundle()}>
          Exportar proyecto
        </Button>
        <Button component="label" startIcon={<UploadIcon />}>
          Importar proyecto
          <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && void importBundle(e.target.files[0])} />
        </Button>
      </Stack>

      {/* Plantillas */}
      <Typography variant="h6" sx={{ mt: 1 }}>Plantillas (blueprints instalables)</Typography>
      {templates === null && <LinearProgress />}
      {templates?.length === 0 && <Typography fontSize={13.6} color="text.secondary">Sin plantillas en el repo.</Typography>}
      <Stack spacing={1.2}>
        {templates?.map((t) => (
          <Card key={t.id}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                <Typography fontSize={14.4} fontWeight={600}>{t.title}</Typography>
                <Chip size="small" variant="outlined" label={t.kind} />
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" startIcon={<InstallIcon />} onClick={() => void installTemplate(t.id)} disabled={busy}>
                  Instalar
                </Button>
              </Stack>
              <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.4 }}>{t.description}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Divider />

      {/* Lifecycle de agentes */}
      <Typography variant="h6">Agentes — versiones y clonado</Typography>
      <Stack spacing={1.2}>
        {agents.map((a) => (
          <Card key={a.id}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                <code>{a.id}</code>
                <Chip size="small" variant="outlined" label={`v${a.version}`} />
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title="Historial de versiones">
                  <IconButton size="small" onClick={() => void loadVersions(a.id)}><HistoryIcon fontSize="small" /></IconButton>
                </Tooltip>
              </Stack>
              {versions[a.id] && (
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.6, mt: 0.8 }}>
                  {versions[a.id].map((v) => (
                    <Chip key={v.version} size="small" variant="outlined" label={`v${v.version}${v.createdAt ? ` · ${fmtDate(v.createdAt)}` : ''}`} />
                  ))}
                </Stack>
              )}
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mt: 1 }}>
                {cloneTarget === a.id ? (
                  <>
                    <TextField size="small" label="nuevo id (copia)" value={cloneId} onChange={(e) => setCloneId(e.target.value)} sx={{ width: 260 }} />
                    <Button size="small" variant="contained" onClick={() => void clone(a.id)} disabled={!cloneId.trim() || busy}>Clonar</Button>
                    <Button size="small" onClick={() => setCloneTarget(null)}>Cancelar</Button>
                  </>
                ) : (
                  <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => { setCloneTarget(a.id); setCloneId(`${a.id}-copia`) }}>
                    Clonar
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  )
}
