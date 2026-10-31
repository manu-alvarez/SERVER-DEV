import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import ExtensionIcon from '@mui/icons-material/ExtensionRounded'
import { api, type SpecDoc, type SpecSummary, type ToolSpecDoc } from '../lib/api'

/** Herramientas (Tool Registry): adapters cerrados, permisos requeridos y
 *  mapa de autorización por agente. La edición de autorización vive en el
 *  Agent Manager (tools[].id + permissions del AgentSpec). */

type AgentAuth = { agent: SpecSummary; granted: boolean; permissions: string[] }

export default function Tools(): ReactNode {
  const [tools, setTools] = useState<ToolSpecDoc[] | null>(null)
  const [agents, setAgents] = useState<Array<{ summary: SpecSummary; doc: SpecDoc }>>([])

  useEffect(() => {
    api
      .tools()
      .then(setTools)
      .catch(() => setTools([]))
      .then(async () => {
        const list = await api.specs.list().catch((): SpecSummary[] => [])
        const loaded: Array<{ summary: SpecSummary; doc: SpecDoc }> = []
        for (const summary of list.filter((s) => s.kind === 'Agent')) {
          const doc = await api.specs.get(summary.id).catch((): SpecDoc | null => null)
          if (doc) {
            loaded.push({ summary, doc })
          }
        }
        setAgents(loaded)
      })
  }, [])

  const authMap = useMemo(() => {
    const map = new Map<string, AgentAuth[]>()
    for (const { summary: agent, doc } of agents) {
      const spec = (doc.spec ?? {}) as { tools?: Array<{ id: string; permissions?: string[] }> }
      for (const t of spec.tools ?? []) {
        map.set(t.id, [...(map.get(t.id) ?? []), { agent, granted: true, permissions: t.permissions ?? [] }])
      }
    }
    return map
  }, [agents])

  if (tools === null) {
    return <LinearProgress sx={{ mt: 6, mx: 4, borderRadius: 2 }} />
  }

  return (
    <Stack spacing={2.4}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <ExtensionIcon sx={{ color: 'text.secondary' }} />
        <Typography variant="h4">Herramientas</Typography>
      </Stack>
      <Alert severity="info" icon={false} sx={{ bgcolor: 'rgba(124,140,255,0.06)' }}>
        Adaptadores cerrados del Tool Registry (nunca shell ni código arbitrario). La autorización es
        <strong> deny-by-default</strong>: un agente solo puede llamar una herramienta si su AgentSpec la declara
        (<code>tools[].id</code>) y otorga los permisos exigidos (<code>tools[].permissions</code>). Edita autorizaciones en el
        <strong> Agent Manager</strong>.
      </Alert>

      {tools.length === 0 && <Alert severity="warning">El Tool Registry está vacío (las semillas llegan al arrancar el backend).</Alert>}

      {tools.map((tool) => {
        const auths = authMap.get(tool.metadata.id) ?? []
        return (
          <Card key={tool.metadata.id}>
            <CardContent sx={{ p: 2.4, '&:last-child': { pb: 2.4 } }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                <Typography variant="h6">
                  {tool.metadata.name} <code style={{ opacity: 0.7 }}>{tool.metadata.id}</code>
                </Typography>
                <Chip size="small" color="secondary" variant="outlined" label={`adapter: ${tool.spec.execution.adapter}`} />
                <Box sx={{ flexGrow: 1 }} />
                {(tool.spec.permissions ?? []).map((p) => (
                  <Chip key={p} size="small" variant="outlined" label={`requiere ${p}`} />
                ))}
              </Stack>
              <Typography fontSize={13.6} color="text.secondary" sx={{ mt: 0.6 }}>
                {tool.spec.description}
              </Typography>
              {Object.keys(tool.spec.inputSchema.properties ?? {}).length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    ESQUEMA DE ENTRADA
                  </Typography>
                  <Box component="pre" sx={{ m: 0.3, fontSize: 12, overflowX: 'auto', bgcolor: 'rgba(2,6,23,0.5)', p: 1, borderRadius: 1.6 }}>
                    {JSON.stringify(tool.spec.inputSchema, null, 2)}
                  </Box>
                </Box>
              )}
              <Box sx={{ mt: 1.4 }}>
                <Typography variant="caption" color="text.secondary">
                  AUTORIZADA POR
                </Typography>
                <Table size="small" sx={{ mt: 0.4 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Agente</TableCell>
                      <TableCell>Permisos otorgados</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auths.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} color="text.secondary" style={{ color: '#94a3b8' }}>
                          Ningún agente la autoriza todavía.
                        </TableCell>
                      </TableRow>
                    )}
                    {auths.map((a) => (
                      <TableRow key={a.agent.id}>
                        <TableCell>
                          <code>{a.agent.id}</code>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.6} sx={{ flexWrap: 'wrap' }}>
                            {a.permissions.length === 0 ? (
                              <Chip size="small" color="error" variant="status" label="ninguno → insufficient_permissions" />
                            ) : (
                              a.permissions.map((p) => (
                                <Chip key={p} size="small" color="success" variant="status" label={p} />
                              ))
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        )
      })}
    </Stack>
  )
}
