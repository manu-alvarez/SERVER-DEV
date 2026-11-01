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
import { NEON } from '../theme'

/**
 * Home 1.1 — pantalla inicial orientada a TAREAS (no a métricas), con el
 * hero distintivo de UIEP: aurora + retícula CSS (sin imágenes, sin deps).
 * El panel técnico operativo vive en Avanzado → Sistema/Observabilidad.
 */

const ACCIONES = [
  { titulo: 'Crear un agente', desc: 'Define quién es, qué sabe y con qué trabaja', to: '/agents/new', icon: <SmartToyIcon sx={{ color: 'primary.main', fontSize: 30 }} /> },
  { titulo: 'Conversar con un agente', desc: 'Habla con tus agentes en sesiones reales', to: '/playground', icon: <ChatIcon sx={{ color: 'success.main', fontSize: 30 }} /> },
  { titulo: 'Diseñar un flujo', desc: 'Compone varios agentes en un proceso visual', to: '/workflows', icon: <AccountTreeIcon sx={{ color: 'secondary.main', fontSize: 30 }} /> },
  { titulo: 'Enseñar algo a un agente', desc: 'Añade documentos a su conocimiento', to: '/knowledge', icon: <AutoStoriesIcon sx={{ color: 'warning.main', fontSize: 30 }} /> },
]

/** Capa aurora: tres resplandores radiales que derivan lentamente.
 *  La animación solo se aplica si el usuario no pide movimiento reducido. */
const auroraLayerSx = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  background: [
    'radial-gradient(520px 240px at 16% 0%, rgba(79, 125, 255, 0.30), transparent 65%)',
    'radial-gradient(460px 220px at 80% 15%, rgba(34, 211, 238, 0.17), transparent 60%)',
    'radial-gradient(430px 260px at 58% 105%, rgba(167, 139, 250, 0.20), transparent 62%)',
  ].join(', '),
  '@media (prefers-reduced-motion: no-preference)': {
    '@keyframes uiepAurora': {
      '0%': { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 0.85 },
      '50%': { opacity: 1 },
      '100%': { transform: 'translate3d(0, -14px, 0) scale(1.06)', opacity: 0.95 },
    },
    animation: 'uiepAurora 13s ease-in-out infinite alternate',
  },
} as const

/** Retícula técnica que se desvanece hacia abajo (identidad "ingeniería"). */
const gridLayerSx = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  backgroundImage:
    'linear-gradient(rgba(124, 140, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 140, 255, 0.08) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
  maskImage: 'radial-gradient(80% 100% at 50% 0%, black 30%, transparent 78%)',
  WebkitMaskImage: 'radial-gradient(80% 100% at 50% 0%, black 30%, transparent 78%)',
} as const

const ACCION_CARD_SX = {
  cursor: 'pointer',
  height: '100%',
  bgcolor: 'rgba(9, 13, 28, 0.72)',
  backgroundImage: 'none',
  '&:hover': {
    borderColor: 'rgba(99, 140, 255, 0.55)',
    boxShadow: '0 6px 26px rgba(79, 125, 255, 0.18)',
    transform: 'translateY(-3px)',
    '& svg': { filter: 'drop-shadow(0 0 8px rgba(99, 140, 255, 0.65))' },
  },
} as const

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
      <Box
        sx={{
          position: 'relative',
          borderRadius: '18px',
          overflow: 'hidden',
          border: '1px solid rgba(99, 140, 255, 0.18)',
          background: 'linear-gradient(180deg, rgba(17, 25, 50, 0.72) 0%, rgba(8, 12, 26, 0.94) 100%)',
          boxShadow: '0 0 34px rgba(79, 125, 255, 0.10)',
          p: { xs: 2.6, md: 4 },
        }}
      >
        <Box aria-hidden sx={auroraLayerSx} />
        <Box aria-hidden sx={gridLayerSx} />

        <Stack sx={{ position: 'relative' }} spacing={2.6}>
          <Chip
            size="small"
            label="PLATAFORMA DE AGENTES · v1.1"
            sx={{
              alignSelf: 'flex-start',
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.14em',
              bgcolor: 'rgba(79, 125, 255, 0.12)',
              color: NEON.blueSoft,
              border: '1px solid rgba(99, 140, 255, 0.3)',
            }}
          />
          <Box>
            <Typography
              variant="h3"
              sx={{
                mb: 0.5,
                fontWeight: 800,
                background: `linear-gradient(92deg, ${NEON.textPrimary} 25%, ${NEON.blueSoft} 70%, ${NEON.cyan} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Hola, Manuel
            </Typography>
            <Typography color="text.secondary">¿Qué quieres crear hoy?</Typography>
          </Box>

          <Grid2 container spacing={2}>
            {ACCIONES.map((a) => (
              <Grid2 key={a.titulo} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card
                  onClick={() => navigate(a.to)}
                  sx={ACCION_CARD_SX}
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
        </Stack>
      </Box>

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
            <Card key={a.id} onClick={() => navigate(`/playground?agent=${a.id}`)} sx={{ cursor: 'pointer', '&:hover': { borderColor: 'rgba(99, 140, 255, 0.55)', boxShadow: '0 4px 22px rgba(79, 125, 255, 0.14)' } }}>
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
