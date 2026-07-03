import { useState } from 'react'
import {
  Box, Card, Typography, TextField, Stack, Slider, Chip, Grid,
} from '@mui/material'
import {
  Calculate as CalcIcon,
} from '@mui/icons-material'
import { alpha } from '@mui/material/styles'

const CONTAINER_TYPES = [
  { code: '20DC', name: '20ft Dry', internal: '5.898 x 2.352 x 2.393', cbm: 33.1, maxPayload: 28230 },
  { code: '40DC', name: '40ft Dry', internal: '12.032 x 2.352 x 2.393', cbm: 67.7, maxPayload: 28750 },
  { code: '40HC', name: '40ft HC', internal: '12.032 x 2.352 x 2.698', cbm: 76.3, maxPayload: 28600 },
  { code: '20RF', name: '20ft Reefer', internal: '5.456 x 2.290 x 2.270', cbm: 28.4, maxPayload: 24800 },
  { code: '40RH', name: '40ft Reefer HC', internal: '11.590 x 2.290 x 2.557', cbm: 67.9, maxPayload: 27600 },
  { code: '20OT', name: '20ft Open Top', internal: '5.898 x 2.352 x 2.393', cbm: 33.1, maxPayload: 26100 },
  { code: '40OT', name: '40ft Open Top', internal: '12.032 x 2.352 x 2.393', cbm: 67.7, maxPayload: 26600 },
]

const PALLET_TYPES = [
  { name: 'Europallet EUR', dimensions: '1.20 x 0.80', cbm: 0.384, weight: 25 },
  { name: 'Europallet EUR2', dimensions: '1.20 x 1.00', cbm: 0.480, weight: 30 },
  { name: 'Pallet UK', dimensions: '1.20 x 1.00', cbm: 0.480, weight: 30 },
  { name: 'Pallet US', dimensions: '1.20 x 1.06', cbm: 0.504, weight: 35 },
  { name: 'Pallet Industrial', dimensions: '1.20 x 1.20', cbm: 0.576, weight: 40 },
  { name: 'Personalizado', dimensions: '0.00 x 0.00', cbm: 0, weight: 0 },
]

export default function CbmCalculator() {
  const [selectedContainer, setSelectedContainer] = useState(CONTAINER_TYPES[2])
  const [selectedPallet, setSelectedPallet] = useState(PALLET_TYPES[0])
  const [palletHeight, setPalletHeight] = useState(1.6)
  const [customLength, setCustomLength] = useState(1.2)
  const [customWidth, setCustomWidth] = useState(0.8)

  const height = palletHeight
  const length = selectedPallet.name === 'Personalizado' ? customLength : parseFloat(selectedPallet.dimensions.split(' x ')[0])
  const width = selectedPallet.name === 'Personalizado' ? customWidth : parseFloat(selectedPallet.dimensions.split(' x ')[1])
  const palletCbm = length * width * height
  const maxPalletsPerContainer = palletCbm > 0 ? selectedContainer.cbm / palletCbm : 0
  const palletsFloor = (length > 0 && width > 0) ? Math.floor((parseFloat(selectedContainer.internal.split(' x ')[0]) / length) *
    (parseFloat(selectedContainer.internal.split(' x ')[1]) / width)) : 0

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalcIcon sx={{ color: 'primary.main' }} />
        Calculadora CBM
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="overline" sx={{ color: 'text.disabled' }}>Tipo de contenedor</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
            {CONTAINER_TYPES.map(ct => (
              <Chip
                key={ct.code}
                label={`${ct.code} (${ct.cbm} CBM)`}
                size="small"
                color={selectedContainer.code === ct.code ? 'primary' : 'default'}
                variant={selectedContainer.code === ct.code ? 'filled' : 'outlined'}
                onClick={() => setSelectedContainer(ct)}
              />
            ))}
          </Stack>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {selectedContainer.name} — Interior: {selectedContainer.internal} m
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
              Capacidad: {selectedContainer.cbm} CBM | Payload: {(selectedContainer.maxPayload / 1000).toFixed(1)} ton
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="overline" sx={{ color: 'text.disabled' }}>Tipo de pallet</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
            {PALLET_TYPES.map(pt => (
              <Chip
                key={pt.name}
                label={pt.name}
                size="small"
                color={selectedPallet.name === pt.name ? 'primary' : 'default'}
                variant={selectedPallet.name === pt.name ? 'filled' : 'outlined'}
                onClick={() => setSelectedPallet(pt)}
              />
            ))}
          </Stack>

          {selectedPallet.name === 'Personalizado' && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <TextField size="small" label="Largo (m)" type="number" value={customLength}
                onChange={e => setCustomLength(Math.max(0.1, parseFloat(e.target.value) || 0.1))} slotProps={{ htmlInput: { step: 0.05, min: 0.1 } }} />
              <TextField size="small" label="Ancho (m)" type="number" value={customWidth}
                onChange={e => setCustomWidth(Math.max(0.1, parseFloat(e.target.value) || 0.1))} slotProps={{ htmlInput: { step: 0.05, min: 0.1 } }} />
            </Stack>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
              Altura de la carga en pallet: {height.toFixed(2)} m
            </Typography>
            <Slider
              value={palletHeight}
              onChange={(_, v) => setPalletHeight(v as number)}
              min={0.5}
              max={2.5}
              step={0.05}
              valueLabelDisplay="auto"
              valueLabelFormat={v => `${v.toFixed(2)}m`}
            />
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, p: 3, borderRadius: 2, border: '2px solid', borderColor: alpha('#00E5FF', 0.4), bgcolor: alpha('#00E5FF', 0.06), textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #00E5FF, #00B8D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {palletCbm.toFixed(2)} CBM
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          por pallet ({length.toFixed(2)} x {width.toFixed(2)} x {height.toFixed(2)} m)
        </Typography>

        <Grid container spacing={2} sx={{ maxWidth: 600, mx: 'auto' }}>
          <Grid size={{ xs: 4 }}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {Math.floor(maxPalletsPerContainer)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Pallets teóricos
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {Math.max(0, palletsFloor)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Pallets en piso
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.light' }}>
                {(selectedContainer.cbm - palletCbm * Math.floor(maxPalletsPerContainer)).toFixed(1)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                CBM sobrante
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 2, textAlign: 'center' }}>
        * Cálculo teórico. El aprovechamiento real depende del peso, distribución y tipo de mercancía.
      </Typography>
    </Card>
  )
}
