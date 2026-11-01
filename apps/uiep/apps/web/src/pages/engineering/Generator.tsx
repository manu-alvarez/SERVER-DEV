import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Alert, Box, Button, Chip, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import CheckIcon from '@mui/icons-material/CheckCircleOutline'
import BoltIcon from '@mui/icons-material/BoltRounded'
import { api, type GenerateOkResponse, type GeneratorInfo } from '../../lib/api'
import { truncate } from '../../lib/engineering'
import { JsonBox, KV, Panel, SectionHeader } from './shared'

/**
 * Artifact Generator (Misión 15) — el mismo Generator Engine del backend:
 * elegir tipo → ver contrato (inputShape real) → cargar preset → validar
 * (dry-run) → generar. La validación REAL y el registro los hace el backend.
 */

/** Presets REALES (los mismos payloads de backend/examples) — nada ficticio. */
const PRESETS: Record<string, unknown> = {
  agent: {
    name: 'Agente desde el Control Center',
    role: 'asistente',
    objective: 'demostrar el generador',
    system: 'Agente generado desde la interfaz del Control Center (Misión 15).',
    memory: { enabled: false, strategy: 'none' },
  },
  workflow: {
    name: 'Flujo desde el Control Center',
    steps: [{ agent: 'REEMPLAZAR_POR_ID_DE_AGENTE' }],
  },
  'prompt-system': {
    name: 'Prompts del Control Center',
    prompts: [{ name: 'Saludo', template: 'Hola {{quien}}.', variables: [{ name: 'quien', type: 'string' }] }],
  },
  'api-platform': {
    name: 'API del Control Center',
    endpoints: [{ id: 'ping', method: 'GET', path: '/api/ping', summary: 'salud del contrato' }],
  },
  application: {
    name: 'App del Control Center',
    entryModule: 'api',
    modules: [{ ref: 'api', kind: 'api-platform', componentRef: { kind: 'ApiPlatform', id: 'REEMPLAZAR_POR_ID_DE_API' } }],
  },
  'agentic-app': {
    name: 'App agéntica del Control Center',
    agents: [{ agent: 'REEMPLAZAR_POR_ID_DE_AGENTE', role: 'núcleo' }],
    surfaces: [{ type: 'console' }],
  },
  saas: {
    name: 'SaaS del Control Center',
    entryModule: 'app',
    modules: [{ ref: 'app', kind: 'application', componentRef: { kind: 'Application', id: 'REEMPLAZAR_POR_ID_DE_APP' } }],
    roles: [{ name: 'admin', permissions: [] }],
  },
  framework: {
    name: 'Framework del Control Center',
    components: [{ type: 'agent', ref: { id: 'REEMPLAZAR_POR_ID_DE_AGENTE', kind: 'Agent' } }],
    modules: [],
  },
  'source-project': {
    apiId: 'REEMPLAZAR_POR_ID_DE_API',
    version: '1.0.0',
  },
}

export default function Generator(): ReactNode {
  const [generators, setGenerators] = useState<GeneratorInfo[] | null>(null)
  const [engineVersion, setEngineVersion] = useState('')
  const [type, setType] = useState('')
  const [text, setText] = useState('{}')
  const [validating, setValidating] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [checks, setChecks] = useState<Array<{ name: string; passed: boolean }> | null>(null)
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null)
  const [result, setResult] = useState<GenerateOkResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api.eng
      .generators()
      .then((r) => {
        setGenerators(r.generators)
        setEngineVersion(r.engineVersion)
        setType((t) => t || r.generators[0]?.type || '')
      })
      .catch(() => setError('No se pudo cargar la lista de generadores.'))
  }, [])

  useEffect(load, [load])

  const info = useMemo(() => generators?.find((g) => g.type === type) ?? null, [generators, type])

  const parsed = useMemo(() => {
    try {
      return { ok: true, value: JSON.parse(text) as unknown }
    } catch (e) {
      return { ok: false, value: (e as Error).message }
    }
  }, [text])

  const doValidate = async () => {
    if (!parsed.ok || !type) {
      return
    }
    setValidating(true)
    setErrors(null)
    setChecks(null)
    setError(null)
    try {
      const r = await api.eng.validate(type, parsed.value)
      if (r.ok) {
        setChecks(r.checks ?? [])
      } else {
        setErrors(r.errors ?? { error: ['validación fallida'] })
      }
    } catch (e) {
      setError(truncate((e as Error).message, 120))
    } finally {
      setValidating(false)
    }
  }

  const doGenerate = async () => {
    if (!parsed.ok || !type) {
      return
    }
    setGenerating(true)
    setErrors(null)
    setError(null)
    setResult(null)
    try {
      setResult(await api.eng.generate(type, parsed.value))
    } catch (e) {
      const payload = (e as { payload?: { error?: unknown } }).payload
      setErrors(typeof payload === 'object' && payload ? { error: [JSON.stringify(payload).slice(0, 300)] } : { error: [truncate((e as Error).message, 160)] })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Panel>
      <SectionHeader
        title="Generador de artefactos"
        subtitle={engineVersion ? `Generator Engine ${engineVersion} — valida (dry-run) y genera con el mismo motor que el backend` : undefined}
      />
      {generators && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="gen-type-label">Tipo de artefacto</InputLabel>
            <Select labelId="gen-type-label" label="Tipo de artefacto" value={type} onChange={(e) => { setType(e.target.value); setChecks(null); setErrors(null); setResult(null) }}>
              {generators.map((g) => (
                <MenuItem key={g.type} value={g.type}>
                  {g.type} — {g.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {PRESETS[type] !== undefined && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => { setText(JSON.stringify(PRESETS[type], null, 2)); setChecks(null); setErrors(null); setResult(null) }}
            >
              Cargar preset real
            </Button>
          )}
        </Stack>
      )}
      {info && (
        <Box sx={{ mb: 2 }}>
          <KV k="Destino" v={info.outStore === 'specs' ? 'data/specs (ejecutable por el runtime)' : 'data/engineering/artifacts'} />
          <KV k="Contrato" v={info.inputShape} />
        </Box>
      )}
      <TextField
        label="Entrada JSON (según el contrato del tipo)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        multiline
        minRows={8}
        maxRows={18}
        fullWidth
        error={!parsed.ok}
        helperText={parsed.ok ? undefined : `JSON inválido: ${truncate(String(parsed.value), 80)}`}
        slotProps={{ input: { sx: { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13 } } }}
      />
      <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
        <Button variant="outlined" startIcon={<CheckIcon />} disabled={!parsed.ok || validating || generating} onClick={doValidate}>
          {validating ? 'Validando…' : 'Validar (dry-run)'}
        </Button>
        <Button variant="contained" startIcon={<BoltIcon />} disabled={!parsed.ok || validating || generating} onClick={doGenerate}>
          {generating ? 'Generando…' : 'Generar'}
        </Button>
      </Stack>

      {checks && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Validación OK — {checks.map((c) => c.name).join(', ')}
        </Alert>
      )}
      {errors && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <JsonBox data={errors} max={160} />
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}
      {result && (
        <Box sx={{ mt: 2 }}>
          <Alert severity={result.reused ? 'info' : 'success'}>
            {result.reused ? 'Reutilizado (contenido idéntico — idempotente)' : 'Generado y registrado'} · <Chip size="small" label={`${result.outcome.store === 'specs' ? result.outcome.specKind : result.outcome.artifactKind} ${result.outcome.id}@${result.outcome.version}`} variant="outlined" />
          </Alert>
          <Stack spacing={1} sx={{ mt: 1.5 }}>
            <KV k="generationId" v={result.generationId} />
            <KV k="outputHash" v={result.provenance.outputHash.slice(0, 24) + '…'} />
            {result.warnings.length > 0 && <Typography variant="caption" color="warning.main">{result.warnings.join(' · ')}</Typography>}
            <JsonBox data={result} max={220} />
          </Stack>
        </Box>
      )}
    </Panel>
  )
}
