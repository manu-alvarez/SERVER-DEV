import { Box, Paper, Typography, Grid, Chip, Button, Chip as MChip } from '@mui/material'
import { ExternalLink as PluginIcon, Code as CodeIcon, Save as SaveIcon, Delete as DeleteIcon } from 'lucide-react'
import { useState } from 'react'
import { getMCP, saveMCP, type MCPServer } from '../lib/api'

export default function MCP() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [command, setCommand] = useState('')
  const [args, setArgs] = useState('')

  const load = async () => {
    try {
      const r = await getMCP()
      setServers(r.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    try {
      await saveMCP({ id: '', name, command, args: args.split(' ').filter(Boolean), env: {} })
      load()
      setName(''); setCommand(''); setArgs('')
    } catch (e) {
      alert('Error guardando MCP')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Servidores MCP</Typography>
          <Typography sx={{ color: '#94a3b8' }}>Conecta UIEP con servidores de protocolo Modelo de Contexto localmente.</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Servidores Configurados</Typography>
            {loading ? <Box sx={{ py: 4, textAlign: 'center', color: '#64748b' }}>Cargando...</Box> : servers.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center', color: '#64748b' }}>No hay servidores MCP configurados.</Box>
            ) : (
              <Grid container spacing={2}>
                {servers.map((s) => (
                  <Grid key={s.id} xs={12} sm={6}>
                    <Paper sx={{ p: 2, borderRadius: '10px', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ExtensionIcon sx={{ color: '#a78bfa' }} />
                        <Typography sx={{ fontWeight: 600 }}>{s.name}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <MChip label={s.command} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }} />
                        {s.args.map((a) => <MChip key={a} label={a} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }} />)}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        <Grid xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Añadir Servidor MCP</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <input
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-400 focus:outline-none"
              />
              <input
                placeholder="Comando (ej: npx)"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-400 focus:outline-none"
              />
              <input
                placeholder="Argumentos separados por espacios"
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                className="bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-400 focus:outline-none"
              />
              <Button
                variant="contained"
                onClick={save}
                startIcon={<SaveIcon />}
                sx={{ background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)', color: '#030712', fontWeight: 800, borderRadius: '10px', py: 1 }}
              >
                Guardar Servidor
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
