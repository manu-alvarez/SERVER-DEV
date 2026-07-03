import { useState } from 'react'
import {
  Box, Card, Typography, TextField, Button, Chip, Stack, Grid, Tooltip,
} from '@mui/material'
import {
  Search as SearchIcon, DirectionsBoat as VesselIcon,
  OpenInNew as ExternalIcon,
} from '@mui/icons-material'

const PLATFORMS = [
  { name: 'MarineTraffic', url: 'https://www.marinetraffic.com/en/ais/details/ships/imo:', icon: '🛰️', color: '#0077BE' },
  { name: 'VesselFinder', url: 'https://www.vesselfinder.com/vessels?imo=', icon: '📡', color: '#1A5276' },
  { name: 'MyShipTracking', url: 'https://www.myshiptracking.com/vessels?imo=', icon: '🛸', color: '#2E86C1' },
  { name: 'ShipFinder', url: 'https://shipfinder.co/vessels?imo=', icon: '🔍', color: '#3498DB' },
  { name: 'SeaRates', url: 'https://www.searates.com/maritime/imo/', icon: '🌊', color: '#00B4D8' },
  { name: 'FleetMon', url: 'https://www.fleetmon.com/vessels/?imo=', icon: '📊', color: '#1ABC9C' },
]

export default function VesselTracker() {
  const [vesselName, setVesselName] = useState('')
  const [imo, setImo] = useState('')
  const [recent, setRecent] = useState<string[]>([])

  const handleSearch = () => {
    const entry = [vesselName, imo].filter(Boolean).join(' | ')
    if (!entry) return
    setRecent(prev => [entry, ...prev.filter(c => c !== entry)].slice(0, 5))
  }

  const hasValidImo = imo.length === 7 && /^\d{7}$/.test(imo)

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <VesselIcon sx={{ color: 'primary.main' }} />
        Vessel Tracking
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            value={vesselName}
            onChange={e => setVesselName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Nombre del buque (ej: MSC IRINA)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            value={imo}
            onChange={e => setImo(e.target.value.replace(/\D/g, '').slice(0, 7))}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="IMO (7 dígitos)"
            slotProps={{
              htmlInput: { sx: { fontFamily: 'monospace', letterSpacing: '0.1em' } },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }}>
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={!vesselName && !hasValidImo}
            startIcon={<SearchIcon />}
            fullWidth
            sx={{ height: 40 }}
          >
            Buscar
          </Button>
        </Grid>
      </Grid>

      {(vesselName || hasValidImo) && (
        <>
          <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', mb: 1.5 }}>
            Ver en plataformas de tracking
          </Typography>
          <Grid container spacing={1}>
            {PLATFORMS.map(p => {
              const url = imo
                ? `${p.url}${imo}`
                : `https://www.google.com/search?q=${encodeURIComponent(vesselName + ' vessel tracking')}`
              return (
                <Grid key={p.name} size={{ xs: 6, sm: 4 }}>
                  <Tooltip title={`Ver en ${p.name}`}>
                    <Button
                      component="a"
                      href={url}
                      target="_blank"
                      variant="outlined"
                      fullWidth
                      sx={{
                        justifyContent: 'flex-start', gap: 1,
                        color: p.color,
                        borderColor: 'divider',
                        '&:hover': { borderColor: p.color, bgcolor: `${p.color}11` },
                        textTransform: 'none',
                      }}
                    >
                      <Box sx={{ fontSize: '1.1rem' }}>{p.icon}</Box>
                      <Box sx={{ flex: 1, textAlign: 'left' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.2 }}>
                          {p.name}
                        </Typography>
                      </Box>
                      <ExternalIcon sx={{ fontSize: 14, opacity: 0.5 }} />
                    </Button>
                  </Tooltip>
                </Grid>
              )
            })}
          </Grid>
        </>
      )}

      {recent.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="overline" sx={{ color: 'text.disabled' }}>
            Recientes
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
            {recent.map(c => (
              <Chip key={c} label={c} size="small" onClick={() => {
                const parts = c.split(' | ')
                setVesselName(parts[0] || '')
                setImo(parts[1] || '')
              }} />
            ))}
          </Stack>
        </Box>
      )}
    </Card>
  )
}
