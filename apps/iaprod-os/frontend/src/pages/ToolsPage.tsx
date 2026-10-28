import { Box, Typography, Button, Paper, Chip, Grid, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { DeviceHub as DeviceHubIcon, Code as CodeIcon, Terminal as TerminalIcon, Shield as ShieldIcon } from '@mui/icons/material'

export default function ToolsPage() {
  const tools = [
    { name: 'Búsqueda Web', status: 'Activo', icon: <CodeIcon />, color: '#22d3ee' },
    { name: 'Hotmail / Graph', status: 'Configurado', icon: <ShieldIcon />, color: '#a78bfa' },
    { name: 'Google Workspace', status: 'Configurado', icon: <CodeIcon />, color: '#4ade80' },
    { name: 'Telegram', status: 'Desconectado', icon: <ShieldIcon />, color: '#94a3b8' },
    { name: 'Docker / Contenedores', status: 'Disponible', icon: <TerminalIcon />, color: '#fde047' },
    { name: 'Ejecutar Python (Sandbox)', status: 'Activo', icon: <CodeIcon />, color: '#22d3ee' },
    { name: 'Control de SO', status: 'Restringido', icon: <ShieldIcon />, color: '#94a3b8' },
  ]

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Herramientas del Sistema</Typography>
        <Typography sx={{ color: '#94a3b8' }}>Capacidades de IA Prod OS para actuar en el mundo real.</Typography>
      </Box>

      <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(10, 15, 26, 0.7)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <Table sx={{ minWidth: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Herramienta</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Acceso</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tools.map((t) => (
              <TableRow key={t.name} sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 600 }}>
                  {t.icon}
                  {t.name}
                </TableCell>
                <TableCell>
                  <Chip label={t.status} size="small" sx={{ color: t.color, borderColor: `rgba(${t.color === '#22d3ee' ? '34,211,238' : t.color === '#a78bfa' ? '167,139,250' : t.color === '#4ade80' ? '74,222,128' : t.color === '#fde047' ? '253,224,71' : '148,163,184'}, 0.3)` }} />
                </TableCell>
                <TableCell>
                  {t.status === 'Activo' ? <Chip label="Disponible" size="small" sx={{ color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)' }} /> : <Chip label="Pendiente" size="small" sx={{ color: '#94a3b8', borderColor: 'rgba(148,163,184,0.3)' }} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}
