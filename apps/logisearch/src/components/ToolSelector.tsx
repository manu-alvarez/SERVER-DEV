import { Box, Card, Typography, Chip } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'
import {
  DirectionsBoat as ShipIcon,
  Anchor as AnchorIcon,
  Inventory2 as ContainerIcon,
  Straighten as DimensionsIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Email as EmailIcon,
  Public as GlobeIcon,
  School as ExpertIcon,
  Brush as BrushIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'

const MotionCard = motion.create(Card)

export interface ToolDef {
  id: string
  label: string
  desc: string
  icon: SvgIconComponent
  color: string
  badge?: string
}

const TOOLS: ToolDef[] = [
  { id: 'route', label: 'Ruta Logística', desc: 'Cotización y análisis de rutas', icon: ShipIcon, color: '#00E5FF', badge: 'AI' },
  { id: 'expert', label: 'Consulta Experto', desc: 'Legislación, normativas y más', icon: ExpertIcon, color: '#00B8D4', badge: 'AI' },
  { id: 'general', label: 'Búsqueda General', desc: 'Cualquier otra consulta', icon: GlobeIcon, color: '#009CDE', badge: 'AI' },
  { id: 'container', label: 'Container Tracker', desc: 'Rastrear contenedores', icon: ContainerIcon, color: '#06b6d4' },
  { id: 'vessel', label: 'Vessel Tracker', desc: 'Localizar buques', icon: AnchorIcon, color: '#0891b2' },
  { id: 'cbm', label: 'Calculadora CBM', desc: 'Capacidad y volumen', icon: DimensionsIcon, color: '#0ea5e9' },
  { id: 'cost', label: 'Coste por Unidad', desc: 'Pallet, caja o unidad', icon: MoneyIcon, color: '#22d3ee' },
  { id: 'dunnage', label: 'Guía de Estiba', desc: 'Void fill y sujeción', icon: WarningIcon, color: '#38bdf8' },
  { id: 'email', label: 'Plantillas Email', desc: 'Correos profesionales', icon: EmailIcon, color: '#84FFFF' },
  { id: 'creative', label: 'Estudio Creativo', desc: 'Generar banners e imágenes', icon: BrushIcon, color: '#00E5FF', badge: 'AI' },
]

interface ToolSelectorProps {
  activeTool: string | null
  onSelect: (toolId: string) => void
}

export default function ToolSelector({ activeTool, onSelect }: ToolSelectorProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
        gap: 2,
      }}
    >
      {TOOLS.map((tool, idx) => {
        const Icon = tool.icon
        const isActive = activeTool === tool.id
        return (
          <MotionCard
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            onClick={() => onSelect(tool.id)}
            sx={{
              p: 2.5,
              textAlign: 'center',
              cursor: 'pointer',
              border: isActive ? `2px solid ${tool.color}` : '1px solid',
              borderColor: isActive ? tool.color : 'divider',
              bgcolor: isActive ? `${tool.color}11` : 'transparent',
              '&:hover': {
                borderColor: tool.color,
                bgcolor: `${tool.color}08`,
                transform: 'translateY(-3px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: `${tool.color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1,
              }}
            >
              <Icon sx={{ fontSize: 24, color: tool.color }} />
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'white', display: 'block', mb: 0.25 }}>
              {tool.label}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', lineHeight: 1.2, display: 'block' }}>
              {tool.desc}
            </Typography>
            {tool.badge && (
              <Chip
                label={tool.badge}
                size="small"
                color="primary"
                sx={{ mt: 0.75, height: 18, fontSize: '0.55rem', fontWeight: 700 }}
              />
            )}
          </MotionCard>
        )
      })}
    </Box>
  )
}
