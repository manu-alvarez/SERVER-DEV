import { Box, Paper, Typography, Button, Chip, Grid, TextField, CircularProgress } from '@mui/material'
import { Code as CodeIcon, Download as DownloadIcon, PlayCircle as PlayIcon, Terminal as TerminalIcon } from 'lucide-react'
import { useState } from 'react'
import { generateEntity, type GenerateRequest } from '../lib/api'

const TYPES = [
  { id: 'agent', label: 'Agente IA', icon: <TerminalIcon /> },
  { id: 'subagent', label: 'Subagente', icon: <CodeIcon /> },
  { id: 'system', label: 'Sistema Agentico', icon: <PlayCircle /> },
  { id: 'mcp', label: 'Servidor MCP', icon: <TerminalIcon /> },
  { id: 'harness', label: 'Harness de Pruebas', icon: <TerminalIcon /> },
  { id: 'adversarial', label: 'Tests Adversariales', icon: <CodeIcon /> },
  { id: 'template', label: 'Plantilla de Estructura', icon: <CodeIcon /> },
]

export default function Generator() {
  const [goal, setGoal] = useState('')
  const [type, setType] = useState('agent')
  const [framework, setFramework] = useState('langgraph')
  const [templateId, setTemplateId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await generateEntity({ goal, type: type as any, framework: framework as any, templateId: templateId || undefined })
      setResult(res.data)
    } catch (e) {
      alert('Error generando: ' + (e as any).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Generador de Código y Estructuras</Typography>
          <Typography sx={{ color: '#94a3b8' }}>Describe qué quieres crear y UIEP genera el código, estructura y configuración localmente.</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>¿Qué quieres crear?</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Ej: Crea un agente de reservas de restaurantes con subagente de confirmación y servidor MCP para calendar"
              sx={{ mt: 1, borderRadius: '10px' }}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {TYPES.map((t) => (
                <Chip
                  key={t.id}
                  label={t.label}
                  onClick={() => setType(t.id)}
                  color={type === t.id ? 'primary' : 'default'}
                  variant={type === t.id ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                />
              ))}
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mr: 1 }}>Framework:</Typography>
              <SelectFramework value={framework} onChange={(e) => setFramework(e.target.value)} />
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mr: 1 }}>Plantilla:</Typography>
              <TextField
                size="small"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                placeholder="ID de plantilla (opcional)"
                sx={{ minWidth: 200, borderRadius: '10px' }}
              />
            </Box>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={loading || !goal.trim()}
                startIcon={<PlayCircle />}
                sx={{
                  background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
                  color: '#030712',
                  fontWeight: 800,
                  px: 4,
                  py: 1.5,
                  borderRadius: '10px',
                  '&:hover': { opacity: 0.9 },
                  '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
                }}
              >
                {loading ? 'Generando...' : 'Generar Estructura'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setGoal('')}
                sx={{ borderRadius: '10px', color: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                Limpiar
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.04)', position: 'sticky', top: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Resultado</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
                <CircularProgress size={32} />
                <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Generando código...</Typography>
              </Box>
            ) : result ? (
              <Box>
                <Typography variant="body2" sx={{ color: '#22d3ee', fontWeight: 700, mb: 1 }}>{result.id}</Typography>
                <Typography variant="caption" sx={{ color: '#64748b', mb: 2 }}>{result.type} · {result.framework}</Typography>
                <Box sx={{ background: '#030712', borderRadius: '10px', p: 2, overflow: 'auto', maxHeight: 400, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'pre-wrap' }}>{result.code?.slice(0, 2000)}</Typography>
                </Box>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  sx={{ mt: 2, borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                >
                  Descargar Archivos
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4, color: '#64748b' }}>
                <TerminalIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                <Typography>Lista para generar</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

function SelectFramework({ value, onChange }: { value: string; onChange: (e: any) => void }) {
  const frameworks = ['langgraph', 'crewai', 'n8n', 'openai', 'custom']
  return (
    <Box sx={{ position: 'relative', minWidth: 160 }}>
      <select
        value={value}
        onChange={onChange}
        sx={{
          bgcolor: 'rgba(15, 23, 42, 0.5)',
          color: '#f8fafc',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          px: 2,
          py: 1,
          fontSize: '0.85rem',
          '&:focus': { borderColor: '#22d3ee', outline: 'none' },
        }}
      >
        {frameworks.map((f) => (
          <option key={f} value={f}>{f.toUpperCase()}</option>
        ))}
      </select>
    </Box>
  )
}
