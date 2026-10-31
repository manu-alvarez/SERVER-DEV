import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardContent, Chip, Grid2, Stack, Typography } from '@mui/material'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import ChatIcon from '@mui/icons-material/Forum'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import AddIcon from '@mui/icons-material/AddRounded'
import ArrowIcon from '@mui/icons-material/ArrowForwardRounded'
import { api, type Overview, type SpecSummary } from '../lib/api'

/**
 * Home 1.1 — pantalla inicial orientada a TAREAS (no a métricas).
 * El panel técnico operativo vive en Avanzado → Sistema/Observabilidad.
 */

const ACCIONES = [
  { titulo: 'Crear un agente', desc: 'Define quién es, qué sabe y con qué trabaja', to: '/agents/new', icon: <SmartToyIcon sx={{ color: 'primary.main', fontSize: 30 }} /> },
  { titulo: 'Conversar con un agente', desc: 'Habla con tus agentes en sesiones reales', to: '/playground', icon: <ChatIcon sx={{ color: 'success.main', fontSize: 30 }} /> },
  { titulo: 'Diseñar un flujo', desc: 'Compone varios agentes en un proceso visual', to: '/workflows', icon: <AccountTreeIcon sx={{ color: 'secondary.main', fontSize: 30 }} /> },
  { titulo: 'Enseñar algo a un agente', desc: 'Añade documentos a su conocimiento', to: '/knowledge', icon: <AutoStoriesIcon sx={{ color: 'warning.main', fontSize: 30 }} /> },
]

export default function Home(): ReactNode {
  const [agents, setAgents] = useState<SpecSummary[]>([])
  const [ov, setOv] = useState<Overview | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.specs.list().then((s) => setAgents(s.filter((x) => x.kind === 'Agent'))).catch(() => setAgents([]))
    api.overview().then(setOv).catch(() => setOv(null))
  }, [])

  const todoOk = ov ? ov.services.backend.ok && ov.services.ollama.ok : null

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h3" sx={{ mb: 0.5 }}>Hola, Manuel</Typography>
        <Typography color="text.secondary">¿Qué quieres crear hoy?</Typography>
      </Box>

      <Grid2 container spacing={2}>
        {ACCIONES.map((a) => (
          <Grid2 key={a.titulo} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card
              onClick={() => navigate(a.to)}
              sx={{ cursor: 'pointer', height: '100%', '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)', transition: 'all .15s' } }}
            >
              <CardContent sx={{ p: 2.6, '&:last-child': { pb: 2.6 } }}>
                {a.icon}
                <Typography fontWeight={700} sx={{ mt: 1.2 }}>{a.titulo}</Typography>
                <Typography fontSize={13.4} color="text.secondary">{a.desc}</Typography>
              </CardContent>
            </Card>
          </Grid2>
        ))}
      </Grid2>

      <Box>
        <Stack direction="row" sx={{ alignItems: 'center', mb: 1.4 }}>
          <Typography variant="h6">Tus agentes</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<AddIcon />} onClick={() => navigate('/agents/new')}>Crear</Button>
        </Stack>
        {agents.length === 0 && (
          <Card><CardContent sx={{ p: 2.4 }}>
            <Typography color="text.secondary">
              Aún no tienes agentes. Un agente en UIEP combina un modelo, instrucciones y
              recursos (herramientas, documentos). <Link to="/agents/new">Crea el primero</Link> — tardas dos minutos.
            </Typography>
          </CardContent></Card>
        )}
        <Stack spacing={1.2}>
          {agents.slice(0, 4).map((a) => (
            <Card key={a.id} onClick={() => navigate(`/playground?agent=${a.id}`)} sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}>
              <CardContent sx={{ p: 2, py: 1.6, display: 'flex', alignItems: 'center', gap: 1.6, '&:last-child': { pb: 1.6 } }}>
                <SmartToyIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontSize={14.4} fontWeight={600}>{a.name}</Typography>
                  <Typography fontSize={12.6} color="text.secondary" noWrap>{a.description ?? 'Sin descripción'}</Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" endIcon={<ArrowIcon />} onClick={(e) => { e.stopPropagation(); navigate(`/playground?agent=${a.id}`) }}>
                  Conversar
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {todoOk === null ? (
          <Chip size="small" variant="outlined" label="estado del sistema: consultando…" />
        ) : todoOk ? (
          <Chip size="small" color="success" variant="status" label="✓ sistema operativo" />
        ) : (
          <Chip size="small" color="error" variant="status" label="proveedor de modelos con problemas" />
        )}
        <Box component="span" sx={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/observability')}>
          detalles en Avanzado
        </Box>
      </Typography>
    </Stack>
  )
}
