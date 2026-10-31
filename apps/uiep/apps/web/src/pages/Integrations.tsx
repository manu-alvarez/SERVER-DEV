import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, IconButton, LinearProgress, Stack, TextField, Tooltip, Typography } from '@mui/material'
import HealthIcon from '@mui/icons-material/HealthAndSafetyRounded'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import ExtensionIcon from '@mui/icons-material/ExtensionRounded'
import { api, type IntegrationSummary } from '../lib/api'

/**
 * Integraciones (Fase 7): catálogo del ecosistema de extensiones. Las
 * IntegrationSpecs son contratos versionados con auth POR REFERENCIA (el
 * valor del secreto vive en las env del despliegue — aquí solo se ve su
 * nombre). MCP es un protocolo de interoperabilidad: el catálogo muestra las
 * herramientas descubiertas en cada servidor MCP.
 */

const EMPTY_INTEGRATION = {
  apiVersion: 'uiep.io/v1',
  kind: 'Integration',
  metadata: { id: 'mi-integracion', name: 'Mi integración', version: '1.0.0' },
  spec: {
    type: 'http-api',
    baseUrl: 'https://api.ejemplo.com',
    auth: { type: 'none' },
    healthPath: '/health',
    headers: {},
  },
}

export default function Integrations(): ReactNode {
  const [integrations, setIntegrations] = useState<IntegrationSummary[] | null>(null)
  const [health, setHealth] = useState<Record<string, { ok: boolean; detail: string; durationMs: number }>>({})
  const [mcpTools, setMcpTools] = useState<Record<string, Array<{ name: string; description?: string }>>>({})
  const [error, setError] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [json, setJson] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    api.integrations.list().then(setIntegrations).catch(() => setIntegrations([]))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const checkHealth = async (id: string) => {
    try {
      const h = await api.integrations.health(id)
      setHealth((s) => ({ ...s, [id]: { ok: h.ok, detail: h.detail, durationMs: h.durationMs } }))
    } catch {
      setHealth((s) => ({ ...s, [id]: { ok: false, detail: 'consulta fallida', durationMs: 0 } }))
    }
  }

  const discover = async (id: string) => {
    try {
      const r = await api.integrations.mcpTools(id)
      setMcpTools((s) => ({ ...s, [id]: r.tools }))
    } catch {
      setError(`No se pudieron descubrir las herramientas MCP de ${id}.`)
    }
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.integrations.save(JSON.parse(json))
      setEditorOpen(false)
      load()
    } catch (err) {
      setError(`Registro rechazado: ${err instanceof Error ? err.message : 'error'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2.6}>
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <ExtensionIcon sx={{ color: 'text.secondary', mr: 1 }} />
        <Typography variant="h4">Integraciones</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Recargar">
          <IconButton onClick={load}><RefreshIcon /></IconButton>
        </Tooltip>
      </Stack>
      <Typography color="text.secondary" fontSize={14.6} maxWidth={860}>
        Catálogo de proveedores externos (HTTP/API y servidores MCP). La autenticación viaja
        <strong> por referencia</strong> (nombre de la variable de entorno — el valor nunca se guarda ni se muestra).
        Las herramientas de integración (<code>http-call</code>, <code>mcp-call</code>) son adaptadores cerrados
        autorizables por agente como cualquier otra tool.
      </Typography>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {editorOpen ? (
        <Card>
          <CardContent sx={{ p: 2.4, '&:last-child': { pb: 2.4 } }}>
            <Stack direction="row" sx={{ alignItems: 'center', mb: 1.2 }}>
              <Typography variant="h6">Nueva integración</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button onClick={() => setEditorOpen(false)}>Cancelar</Button>
              <Button variant="contained" onClick={() => void save()} disabled={saving}>
                {saving ? 'Guardando…' : 'Validar y registrar'}
              </Button>
            </Stack>
            <TextField
              value={json}
              onChange={(e) => setJson(e.target.value)}
              multiline
              fullWidth
              minRows={14}
              slotProps={{ input: { sx: { fontFamily: 'ui-monospace, monospace', fontSize: 12.5 } } }}
            />
          </CardContent>
        </Card>
      ) : (
        <Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setJson(JSON.stringify(EMPTY_INTEGRATION, null, 2)); setEditorOpen(true) }}>
            Nueva integración
          </Button>
        </Box>
      )}

      {integrations === null && <LinearProgress />}
      {integrations?.length === 0 && !editorOpen && <Alert severity="info">Sin integraciones registradas todavía.</Alert>}

      <Stack spacing={1.6}>
        {integrations?.map((i) => (
          <Card key={i.id}>
            <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                <Typography variant="h6" fontSize={15.5}>
                  {i.name} <code style={{ opacity: 0.65, fontSize: 12 }}>{i.id}</code>
                </Typography>
                <Chip size="small" color={i.type === 'mcp-server' ? 'secondary' : 'primary'} variant="status" label={i.type} />
                <Chip size="small" variant="outlined" label={`v${i.version}`} />
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" startIcon={<HealthIcon />} onClick={() => void checkHealth(i.id)}>
                  Health
                </Button>
                {i.type === 'mcp-server' && (
                  <Button size="small" onClick={() => void discover(i.id)}>
                    Descubrir tools
                  </Button>
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.4 }} noWrap>
                {i.baseUrl} · health {i.healthPath} · timeout {i.timeoutMs} ms · auth: {i.auth.type}
                {i.auth.secretEnv ? ` (env:${i.auth.secretEnv})` : ''}
              </Typography>
              {health[i.id] && (
                <Alert severity={health[i.id].ok ? 'success' : 'error'} sx={{ mt: 1 }} variant="outlined">
                  {health[i.id].ok ? 'CONECTADA' : 'SIN CONEXIÓN'} · {health[i.id].detail} ({health[i.id].durationMs} ms)
                </Alert>
              )}
              {mcpTools[i.id] && (
                <Box sx={{ mt: 1.2 }}>
                  <Typography variant="caption" color="text.secondary">
                    HERRAMIENTAS MCP DESCUBIERTAS ({mcpTools[i.id].length})
                  </Typography>
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.8, mt: 0.5 }}>
                    {mcpTools[i.id].map((t) => (
                      <Tooltip key={t.name} title={t.description ?? ''}>
                        <Chip size="small" variant="outlined" label={t.name} />
                      </Tooltip>
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Para usarlas, crea una Tool con adapter <code>mcp-call</code> y config integrationId + mcpTool; el agente
                    la declara y autoriza como cualquier otra.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  )
}
