import { Box, Paper, Typography, Grid, Chip, Button } from '@mui/material'
import { Code as CodeIcon, Save as SaveIcon, Layout as LayersIcon } from 'lucide-react'
import { getTemplates, createTemplate, type Template } from '../lib/api'
import { useEffect, useState } from 'react'

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [code, setCode] = useState('')

  const load = async () => {
    try {
      const r = await getTemplates()
      setTemplates(r.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    try {
      await createTemplate({ name, category, code, variables: {} })
      load()
      setName(''); setCategory(''); setCode('')
    } catch (e) {
      alert('Error guardando plantilla')
    }
  }

  useEffect(() => { load() }, [])

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Plantillas de Estructura</Typography>
          <Typography sx={{ color: '#94a3b8' }}>Plantillas reutilizables para agentes, sistemas y estructuras de trabajo.</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Plantillas Disponibles</Typography>
            {loading ? <Box sx={{ py: 4, textAlign: 'center', color: '#64748b' }}>Cargando...</Box> : templates.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center', color: '#64748b' }}>No hay plantillas. Crea la primera abajo.</Box>
            ) : (
              <Grid container spacing={2}>
                {templates.map((t) => (
                  <Grid key={t.id} xs={12} sm={6}>
                    <Paper sx={{ p: 2, borderRadius: '10px', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CodeIcon sx={{ color: '#22d3ee' }} />
                        <Typography sx={{ fontWeight: 600 }}>{t.name}</Typography>
                      </Box>
                      <Chip label={t.category} size="small" sx={{ fontSize: '0.7rem', bgcolor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }} />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        <Grid xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Crear Plantilla</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <input
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-400 focus:outline-none"
              />
              <input
                placeholder="Categoría"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-400 focus:outline-none"
              />
              <textarea
                placeholder="Código o estructura de la plantilla"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={4}
                className="bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-400 focus:outline-none font-mono text-sm"
              />
              <Button
                variant="contained"
                onClick={save}
                startIcon={<SaveIcon />}
                sx={{ background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)', color: '#030712', fontWeight: 800, borderRadius: '10px', py: 1 }}
              >
                Guardar Plantilla
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
