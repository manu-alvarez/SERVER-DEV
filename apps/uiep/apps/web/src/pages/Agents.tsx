import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  InputAdornment,
  LinearProgress,
  Paper,
  Slider,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  MenuItem,
  FormHelperText,
} from '@mui/material'
import AddIcon from '@mui/icons-material/AddRounded'
import PlayIcon from '@mui/icons-material/PlayArrowRounded'
import EditIcon from '@mui/icons-material/EditRounded'
import KeyIcon from '@mui/icons-material/KeyOffRounded'
import Grid2 from '@mui/material/Grid2'
import { api, type SpecSummary, type ToolSpecDoc } from '../lib/api'

const ID_RE = /^[a-z0-9][a-z0-9-]{2,63}$/
const VER_RE = /^[0-9]+\.[0-9]+\.[0-9]+$/

type ToolRow = {
  tool: ToolSpecDoc
  enabled: boolean
  permissions: string[] // otorgados
  approval: boolean
}

export default function Agents(): ReactNode {
  return <AgentList />
}

/* ── Listado ──────────────────────────────────────────────────────────────── */

export function AgentList(): ReactNode {
  const [specs, setSpecs] = useState<SpecSummary[] | null>(null)
  const navigate = useNavigate()
  const agents = useMemo(() => (specs ?? []).filter((s) => s.kind === 'Agent'), [specs])

  useEffect(() => {
    api.specs.list().then(setSpecs).catch(() => setSpecs([]))
  }, [])

  if (specs === null) {
    return <LinearProgress sx={{ mt: 6, mx: 4, borderRadius: 2 }} />
  }
  return (
    <Stack spacing={2.4}>
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <Typography variant="h4">Agentes</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/agents/new')}>
          Nuevo agente
        </Button>
      </Stack>
      <Card>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 2.4 }}>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Versión</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right" sx={{ pr: 2.4 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {agents.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ pl: 2.4, py: 3, color: 'text.secondary' }}>
                  Aún no hay AgentSpecs. Crea el primero con «Nuevo agente».
                </TableCell>
              </TableRow>
            )}
            {agents.map((a) => (
              <TableRow key={a.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/agents/${a.id}/edit`)}>
                <TableCell sx={{ pl: 2.4 }}>
                  <code>{a.id}</code>
                </TableCell>
                <TableCell>{a.name}</TableCell>
                <TableCell>
                  <Chip size="small" variant="outlined" label={`v${a.version}`} />
                </TableCell>
                <TableCell style={{ maxWidth: 420 }}>
                  <Typography noWrap fontSize={13} color="text.secondary" display="block">
                    {a.description ?? '—'}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ pr: 2.4 }} onClick={(e) => e.stopPropagation()}>
                  <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1 }}>
                    <Link to={`/playground?agent=${a.id}`}>
                      <Button size="small" startIcon={<PlayIcon />}>
                        Probar
                      </Button>
                    </Link>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => navigate(`/agents/${a.id}/edit`)}>
                      Editar
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Typography variant="caption" color="text.secondary">
        Los AgentSpecs son contratos declarativos (<code>uiep.io/v1</code>): este editor produce salidas validadas
        contra el mismo esquema del backend. Registro persistente en el volumen del despliegue.
      </Typography>
    </Stack>
  )
}

/* ── Editor estructurado (crear/editar AgentSpec) ─────────────────────────── */

interface FormState {
  id: string
  name: string
  version: string
  description: string
  role: string
  objective: string
  system: string
  profile: string
  maxIterations: number
  tools: ToolRow[]
}

function emptyForm(): FormState {
  return {
    id: '',
    name: '',
    version: '1.0.0',
    description: '',
    role: '',
    objective: '',
    system: '',
    profile: '',
    maxIterations: 8,
    tools: [],
  }
}

export function AgentEditor({ specId }: { specId: string | null }): ReactNode {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(emptyForm())
  const [profiles, setProfiles] = useState<SpecSummary[]>([])
  const [loading, setLoading] = useState(specId !== null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  useEffect(() => {
    api.profiles.list().then(setProfiles).catch(() => setProfiles([]))
    api
      .tools()
      .then((tools) =>
        setForm((f) => ({
          ...f,
          tools: tools.map((tool) => ({ tool, enabled: false, permissions: [...(tool.spec.permissions ?? [])], approval: false })),
        })),
      )
      .catch(() => setForm((f) => ({ ...f, tools: [] })))
    if (specId) {
      api.specs
        .get(specId)
        .then((doc) => {
          const spec = (doc.spec ?? {}) as AgentSpecPartial
          setForm({
            id: doc.metadata.id,
            name: doc.metadata.name,
            version: doc.metadata.version,
            description: doc.metadata.description ?? '',
            role: spec.identity?.role ?? '',
            objective: spec.identity?.objective ?? '',
            system: spec.instructions?.system ?? '',
            profile: spec.model?.profile ?? '',
            maxIterations: spec.orchestration?.maxIterations ?? 8,
            tools: [],
          })
          // Sincronizar tools con el documento cargado (por id).
          api
            .tools()
            .then((tools) => {
              const declared = Array.isArray(spec.tools) ? (spec.tools as AgentToolDecl[]) : []
              setForm((f) => ({
                ...f,
                tools: tools.map((tool) => {
                  const found = declared.find((d) => d.id === tool.metadata.id)
                  return {
                    tool,
                    enabled: Boolean(found),
                    permissions: found ? (found.permissions ?? []).filter((p) => p !== '*') : [...(tool.spec.permissions ?? [])],
                    approval: false,
                  }
                }),
              }))
            })
            .catch(() => undefined)
          setLoading(false)
        })
        .catch(() => {
          setFormError(`No existe el spec '${specId}'.`)
          setLoading(false)
        })
    }
  }, [specId])

  const idFree = specId === null

  const buildDoc = (): AgentSpecDocShape => ({
    apiVersion: 'uiep.io/v1',
    kind: 'Agent',
    metadata: {
      id: form.id.trim(),
      name: form.name.trim() || form.id.trim(),
      version: form.version.trim() || '1.0.0',
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
    },
    spec: {
      identity: { role: form.role.trim(), objective: form.objective.trim() },
      model: { profile: form.profile },
      instructions: { system: form.system },
      tools: form.tools
        .filter((t) => t.enabled)
        .map((t) => ({ id: t.tool.metadata.id, permissions: t.permissions.length > 0 ? t.permissions : ['*'] })),
      orchestration: { mode: 'single-agent', maxIterations: form.maxIterations },
      security: {
        approvalRequired: form.tools.filter((t) => t.enabled && t.approval).map((t) => t.tool.metadata.id),
      },
      evaluation: {},
    },
  })

  const validate = (): string[] => {
    const errors: string[] = []
    if (!ID_RE.test(form.id.trim())) {
      errors.push('id: minúsculas/números/guiones, 3-64 y sin espacios (slug).')
    }
    if (!VER_RE.test(form.version.trim())) {
      errors.push('version: formato semver (1.0.0).')
    }
    if (!form.name.trim()) {
      errors.push('name: campo obligatorio.')
    }
    if (!form.role.trim() || !form.objective.trim()) {
      errors.push('identity: rol y objetivo son obligatorios.')
    }
    if (!form.profile) {
      errors.push('model.profile: selecciona un ModelProfile registrado.')
    }
    if (!form.system.trim()) {
      errors.push('instructions.system: las instrucciones de sistema son obligatorias.')
    }
    return errors
  }

  const save = async () => {
    setFormError(null)
    setSaved(false)
    const errors = validate()
    if (errors.length > 0) {
      setFormError(errors.join(' · '))
      return
    }
    setSaving(true)
    try {
      await api.specs.save(buildDoc())
      setSaved(true)
      setTimeout(() => navigate('/agents'), 650)
    } catch (err) {
      setFormError(`El backend rechazó el AgentSpec (${err instanceof Error ? err.message : 'error'}). Revisa los campos: los errores de validación del contrato se muestran como JSON en la consola de red.`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LinearProgress sx={{ mt: 6, mx: 4, borderRadius: 2 }} />
  }

  return (
    <Stack spacing={2.4} maxWidth={1100}>
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <Typography variant="h4">
          {specId ? `Editar agente · ${specId}` : 'Nuevo agente'}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={() => navigate('/agents')}>Cancelar</Button>
        <Button variant="contained" onClick={() => void save()} disabled={saving}>
          {saving ? 'Guardando…' : specId ? 'Guardar cambios' : 'Registrar agente'}
        </Button>
      </Stack>

      {saved && <Alert severity="success">AgentSpec registrado en el backend.</Alert>}
      {formError && <Alert severity="error">{formError}</Alert>}

      {/* Identidad */}
      <Section title="Identidad (metadata)">
        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12, sm: 5 }}>
            <TextField
              label="id"
              helperText="slug único; sirve como agentSpecId"
              value={form.id}
              onChange={(e) => set({ id: e.target.value })}
              disabled={!idFree}
              fullWidth
              error={idFree && form.id.length > 0 && !ID_RE.test(form.id)}
            />
          </Grid2>
          <Grid2 size={{ xs: 7, sm: 3.5 }}>
            <TextField label="nombre" value={form.name} onChange={(e) => set({ name: e.target.value })} fullWidth />
          </Grid2>
          <Grid2 size={{ xs: 5, sm: 1.6 }}>
            <TextField label="versión" value={form.version} onChange={(e) => set({ version: e.target.value })} fullWidth />
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            <TextField
              label="descripción"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              fullWidth
              slotProps={{ input: { startAdornment: <InputAdornment position="start">·</InputAdornment> } }}
            />
          </Grid2>
        </Grid2>
      </Section>

      {/* Identidad del agente + instrucciones */}
      <Section title="Rol, objetivo e instrucciones">
        <Stack spacing={2}>
          <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <TextField label="rol" value={form.role} onChange={(e) => set({ role: e.target.value })} fullWidth />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <TextField label="objetivo" value={form.objective} onChange={(e) => set({ objective: e.target.value })} fullWidth />
            </Grid2>
          </Grid2>
          <TextField
            label="instrucciones de sistema"
            value={form.system}
            onChange={(e) => set({ system: e.target.value })}
            multiline
            minRows={3}
            maxRows={10}
            fullWidth
            helperText="Se envía como system + rol/objetivo en cada turno del runtime"
          />
        </Stack>
      </Section>

      {/* Modelo */}
      <Section title="Modelo (por referencia — nunca dentro del spec)">
        {profiles.length === 0 ? (
          <Alert severity="warning">No hay ModelProfiles registrados. Regístralo en el Model Manager (o siembra 'default').</Alert>
        ) : (
          <>
            <TextField select label="ModelProfile" value={form.profile} onChange={(e) => set({ profile: e.target.value })} sx={{ width: 320 }}>
              {profiles.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.id} · v{p.version}
                </MenuItem>
              ))}
            </TextField>
            <FormHelperText>El runtime resuelve el perfil al iniciar la sesión (provider/model/endpoint env:VAR)</FormHelperText>
          </>
        )}
      </Section>

      {/* Herramientas autorizadas */}
      <Section title="Herramientas autorizadas (deny-by-default)">
        {form.tools.length === 0 ? (
          <Typography color="text.secondary" fontSize={14}>
            El Tool Registry no ha sembrado herramientas todavía.
          </Typography>
        ) : (
          <Stack spacing={1.2}>
            {form.tools.map((row, i) => (
              <RowBox key={row.tool.metadata.id}>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1.4, flexWrap: 'wrap' }}>
                  <Switch checked={row.enabled} onChange={(e) => toggleTool(i, e.target.checked)} size="small" />
                  <Typography fontSize={14} sx={{ fontWeight: 600 }}>
                    {row.tool.metadata.name}{' '}
                    <code style={{ opacity: 0.7 }}>{row.tool.metadata.id}</code>
                  </Typography>
                  <Chip size="small" variant="outlined" label={`adapter: ${row.tool.spec.execution.adapter}`} sx={{ opacity: 0.8 }} />
                  <Box sx={{ flexGrow: 1 }} />
                  {row.enabled && (
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.8 }}>
                      {(row.tool.spec.permissions ?? []).map((perm) => (
                        <Chip
                          key={perm}
                          size="small"
                          color={row.permissions.includes(perm) ? 'success' : 'default'}
                          variant={row.permissions.includes(perm) ? 'status' : 'outlined'}
                          icon={row.permissions.includes(perm) ? undefined : <KeyIcon />}
                          label={perm}
                          onClick={() => togglePermission(i, perm)}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Stack>
                  )}
                </Stack>
                <Typography fontSize={12.2} color="text.secondary" sx={{ mt: 0.4 }}>
                  {row.tool.spec.description}
                </Typography>
                {row.enabled && (row.tool.spec.permissions ?? []).length > 0 && (
                  <Typography fontSize={11.8} color={row.permissions.length === 0 ? 'warning.main' : 'text.secondary'} sx={{ mt: 0.3 }}>
                    {row.permissions.length === 0
                      ? 'Sin permisos otorgados → el runtime rechazará las llamadas con insufficient_permissions'
                      : 'Permisos otorgados explícitamente ("*" para todo se genera si quitas los específicos)'}
                  </Typography>
                )}
              </RowBox>
            ))}
            {(form.tools.some((t) => t.enabled)) && (
              <>
                <Divider />
                <Typography variant="caption" color="text.secondary">
                  Aprobación explícita: si una herramienta requiere aprobación humana, márcala — el runtime detiene el turno
                  en estado <code>requires_approval</code> (nunca la simula).
                </Typography>
              </>
            )}
          </Stack>
        )}
      </Section>

      {/* Límites */}
      <Section title="Límites de ejecución">
        <Box sx={{ width: 420 }}>
          <Typography fontSize={13.4} color="text.secondary">
            Máximo de iteraciones del bucle (runtime también aplica TIMEOUT_MS y límites de contexto)
          </Typography>
          <Slider
            value={form.maxIterations}
            min={1}
            max={16}
            step={1}
            marks
            onChange={(_, v) => set({ maxIterations: v as number })}
            valueLabelDisplay="auto"
          />
        </Box>
      </Section>

      <Section title="Vista de contrato (AgentSpec generado)">
        <Paper variant="outlined" component="pre" sx={{ p: 1.6, m: 0, fontSize: 12, overflowX: 'auto', bgcolor: 'rgba(2,6,23,0.6)' }}>
          {JSON.stringify(buildDoc(), null, 2)}
        </Paper>
      </Section>

      <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1 }}>
        <Button onClick={() => navigate('/agents')}>Cancelar</Button>
        <Button variant="contained" onClick={() => void save()} disabled={saving}>
          {saving ? 'Guardando…' : specId ? 'Guardar cambios' : 'Registrar agente'}
        </Button>
      </Stack>
    </Stack>
  )

  function toggleTool(index: number, enabled: boolean) {
    setForm((f) => ({
      ...f,
      tools: f.tools.map((row, i) =>
        i === index ? { ...row, enabled, permissions: enabled && row.permissions.length === 0 ? [...(row.tool.spec.permissions ?? [])] : row.permissions } : row,
      ),
    }))
  }

  function togglePermission(index: number, perm: string) {
    setForm((f) => ({
      ...f,
      tools: f.tools.map((row, i) => {
        if (i !== index) {
          return row
        }
        const has = row.permissions.includes(perm)
        return { ...row, permissions: has ? row.permissions.filter((p) => p !== perm) : [...row.permissions, perm] }
      }),
    }))
  }
}

/* ── Piezas de UI locales ──────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <Card>
      <CardContent sx={{ p: 2.4, '&:last-child': { pb: 2.4 } }}>
        <Typography variant="h6" sx={{ mb: 1.6 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  )
}

function RowBox({ children }: { children: ReactNode }): ReactNode {
  return (
    <Box sx={{ p: 1.2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'rgba(124,140,255,0.04)' }}>
      {children}
    </Box>
  )
}

/* Shapes locales del contrato (cliente): no duplica el paquete @uiep/agent-spec*/
interface AgentToolDecl {
  id: string
  permissions?: string[]
}

interface AgentSpecPartial {
  identity?: { role?: string; objective?: string }
  instructions?: { system?: string }
  model?: { profile?: string }
  tools?: AgentToolDecl[]
  security?: { approvalRequired?: string[] }
  orchestration?: { mode?: string; maxIterations?: number }
}

interface AgentSpecDocShape {
  apiVersion: string
  kind: 'Agent'
  metadata: { id: string; name: string; version: string; description?: string }
  spec: {
    identity: { role: string; objective: string }
    model: { profile: string }
    instructions: { system: string }
    tools: AgentToolDecl[]
    orchestration: { mode: string; maxIterations: number }
    security: { approvalRequired: string[] }
    evaluation: Record<string, never>
  }
}
