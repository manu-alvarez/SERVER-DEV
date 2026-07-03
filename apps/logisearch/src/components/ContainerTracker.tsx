import { useState } from 'react'
import {
  Box, Card, Typography, TextField, Button, Chip, Stack, Grid, Tooltip,
} from '@mui/material'
import {
  Search as SearchIcon,
  OpenInNew as ExternalIcon, Inventory2 as ContainerIcon,
} from '@mui/icons-material'

const CARRIERS = [
  { name: 'Maersk', url: 'https://www.maersk.com/tracking/#/track/', icon: '🚢', color: '#009CDE' },
  { name: 'MSC', url: 'https://www.msc.com/track-a-shipment?search=', icon: '📦', color: '#FFD100' },
  { name: 'CMA CGM', url: 'https://www.cma-cgm.com/ebusiness/tracking?Reference=', icon: '⚓', color: '#00356B' },
  { name: 'Hapag-Lloyd', url: 'https://www.hapag-lloyd.com/en/online-business/tracking/container/', icon: '🟢', color: '#00A651' },
  { name: 'Evergreen', url: 'https://www.evergreen-marine.com/TBF1/jsp/TB1_ContainerTrack.jsp?containerNo=', icon: '🌲', color: '#006747' },
  { name: 'ONE', url: 'https://ecomm.one-line.com/one-ecomm/TRACKING?cntrNo=', icon: '🔷', color: '#009FE3' },
  { name: 'ZIM', url: 'https://www.zim.com/tools/tracking?containerNumber=', icon: '🔴', color: '#ED1C24' },
  { name: 'Yang Ming', url: 'https://www.yangming.com/e-service/tracking/container_tracking.aspx?cn=', icon: '🟡', color: '#003366' },
]

export default function ContainerTracker() {
  const [containerNo, setContainerNo] = useState('')
  const [recent, setRecent] = useState<string[]>([])

  const normalized = containerNo.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

  const handleTrack = () => {
    if (!isValid) return
    setRecent(prev => [normalized, ...prev.filter(c => c !== normalized)].slice(0, 5))
  }

  const isValid = normalized.length >= 4 && normalized.length <= 17 // Standard BIC is 11, but BL numbers can be up to 17

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ContainerIcon sx={{ color: 'primary.main' }} />
        Container Tracking
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          value={containerNo}
          onChange={e => setContainerNo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleTrack()}
          placeholder="Ej: MSCU4820485 o MAEU5732149"
          slotProps={{
            input: {
              sx: { fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.1em' },
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleTrack}
          disabled={!isValid}
          startIcon={<SearchIcon />}
          sx={{ minWidth: 120 }}
        >
          Rastrear
        </Button>
      </Box>

      {isValid && (
        <Typography variant="caption" sx={{ color: 'primary.main', display: 'block', mb: 2 }}>
          {normalized.length}/11 caracteres
          {normalized.length === 11 && ' ✓ Formato BIC válido'}
        </Typography>
      )}

      <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', mb: 1.5 }}>
        Rastrear en navieras
      </Typography>
      <Grid container spacing={1}>
        {CARRIERS.map(carrier => (
          <Grid key={carrier.name} size={{ xs: 6, sm: 4, md: 3 }}>
            <Tooltip title={`Abrir tracking en ${carrier.name}`}>
              <Button
                component="a"
                href={`${carrier.url}${normalized}`}
                target="_blank"
                variant="outlined"
                fullWidth
                disabled={!isValid}
                sx={{
                  justifyContent: 'flex-start',
                  gap: 1,
                  color: carrier.color,
                  borderColor: 'divider',
                  '&:hover': { borderColor: carrier.color, bgcolor: `${carrier.color}11` },
                }}
              >
                <Box sx={{ fontSize: '1.1rem' }}>{carrier.icon}</Box>
                <Box sx={{ flex: 1, textAlign: 'left' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.2 }}>
                    {carrier.name}
                  </Typography>
                </Box>
                <ExternalIcon sx={{ fontSize: 14, opacity: 0.5 }} />
              </Button>
            </Tooltip>
          </Grid>
        ))}
      </Grid>

      {recent.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="overline" sx={{ color: 'text.disabled' }}>
            Recientes
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
            {recent.map(c => (
              <Chip
                key={c}
                label={c}
                size="small"
                onClick={() => { setContainerNo(c) }}
                onDelete={() => setRecent(prev => prev.filter(x => x !== c))}
                sx={{ fontFamily: 'monospace' }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Card>
  )
}
