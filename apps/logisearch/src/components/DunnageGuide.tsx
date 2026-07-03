import { useState } from 'react'
import {
  Box, Card, Typography, TextField, Slider, Chip, Grid, Stack,
} from '@mui/material'
import {
  Warning as WarningIcon, CheckCircle as CheckIcon,
} from '@mui/icons-material'
import { alpha } from '@mui/material/styles'

const DUNNAGE_TYPES = [
  { name: 'Air Bags / Sacos hinchables', density: 0.02, reutilizable: false, img: '🛑' },
  { name: 'Bloques de espuma (Foam Blocks)', density: 0.03, reutilizable: false, img: '🧊' },
  { name: 'Madera (Wood Dunnage)', density: 0.6, reutilizable: true, img: '🪵' },
  { name: 'Cartón corrugado (Void Fill)', density: 0.01, reutilizable: false, img: '📦' },
  { name: 'Plástico burbuja (Bubble Wrap)', density: 0.005, reutilizable: false, img: '💨' },
  { name: 'Espuma de poliuretano (Spray Foam)', density: 0.02, reutilizable: false, img: '🧴' },
  { name: 'Cuñas de goma (Rubber Wedges)', density: 0.5, reutilizable: true, img: '🔺' },
  { name: 'Redes de sujeción (Lashing Nets)', density: 0.15, reutilizable: true, img: '🕸️' },
]

const TIPS = [
  'Nunca mezcles productos incompatibles (ej: químicos con alimentos) en el mismo pallet sin separación adecuada.',
  'Usa esquineros de cartón o plástico para proteger las esquinas de las cajas.',
  'Para carga frágil, usa espuma de poliuretano o colchones de aire, nunca madera suelta.',
  'En contenedores, deja al menos un 5% de espacio para materiales de estiba.',
  'Los air bags son la solución más eficiente para void fill en contenedores llenos.',
  'Para madera, asegúrate de que cumple con NIMF 15 (tratamiento térmico) si es exportación.',
  'El fleje (banding) debe colocarse en vertical, nunca horizontal, para mejor sujeción.',
]

export default function DunnageGuide() {
  const [voidCbm, setVoidCbm] = useState(2.5)
  const [selectedType, setSelectedType] = useState(DUNNAGE_TYPES[0])
  const [cargoWeight, setCargoWeight] = useState(1000)
  const [fragility, setFragility] = useState(5)

  const materialNeeded = voidCbm / selectedType.density
  const estWeight = materialNeeded * selectedType.density * 100

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon sx={{ color: 'primary.main' }} />
        Guía de Estiba y Sujeción (Void Fill / Dunnage)
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="overline" sx={{ color: 'text.disabled' }}>Volumen vacío a rellenar</Typography>
          <Box sx={{ mt: 1, mb: 3 }}>
            <Slider value={voidCbm} onChange={(_, v) => setVoidCbm(v as number)} min={0.1} max={20} step={0.1}
              valueLabelDisplay="auto" valueLabelFormat={v => `${v.toFixed(1)} CBM`} />
            <TextField size="small" type="number" value={voidCbm}
              onChange={e => setVoidCbm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
              slotProps={{ htmlInput: { step: 0.1, min: 0.1 } }} />
          </Box>

          <Typography variant="overline" sx={{ color: 'text.disabled' }}>Peso de la carga (kg)</Typography>
          <Slider value={cargoWeight} onChange={(_, v) => setCargoWeight(v as number)} min={10} max={10000} step={10}
            valueLabelDisplay="auto" valueLabelFormat={v => `${v} kg`} sx={{ mb: 1 }} />

          <Typography variant="overline" sx={{ color: 'text.disabled' }}>Nivel de fragilidad</Typography>
          <Slider value={fragility} onChange={(_, v) => setFragility(v as number)} min={1} max={10} step={1}
            valueLabelDisplay="auto" valueLabelFormat={v => `${v}/10`} sx={{ mb: 1 }} />

          <Chip
            label={fragility <= 3 ? 'Baja fragilidad' : fragility <= 6 ? 'Fragilidad media' : 'Alta fragilidad'}
            color={fragility <= 3 ? 'success' : fragility <= 6 ? 'warning' : 'error'}
            size="small"
          />

          <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', mt: 3, mb: 1 }}>
            Material recomendado
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {DUNNAGE_TYPES.map(dt => (
              <Chip
                key={dt.name}
                label={`${dt.img} ${dt.name.split('(')[0].trim()}`}
                size="small"
                color={selectedType.name === dt.name ? 'primary' : 'default'}
                variant={selectedType.name === dt.name ? 'filled' : 'outlined'}
                onClick={() => setSelectedType(dt)}
              />
            ))}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ p: 3, borderRadius: 2, border: '2px solid', borderColor: alpha('#00E5FF', 0.3), bgcolor: alpha('#00E5FF', 0.05), height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Resultado</Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>Material</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedType.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>Cantidad necesaria</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>{materialNeeded.toFixed(1)} unidades</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>Peso estimado</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{estWeight.toFixed(1)} kg</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>Reutilizable</Typography>
                <Chip label={selectedType.reutilizable ? 'Sí' : 'No'} size="small"
                  color={selectedType.reutilizable ? 'success' : 'default'} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>Densidad</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedType.density} kg/CBM</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>Recomendado para</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {fragility <= 3 ? 'Carga resistente' : fragility <= 6 ? selectedType.reutilizable ? 'Uso general' : 'Carga media' : 'Carga frágil'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
          Consejos de estiba
        </Typography>
        <Stack spacing={1}>
          {TIPS.map((tip, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <CheckIcon sx={{ color: 'primary.main', fontSize: 16, mt: 0.25 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{tip}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Card>
  )
}
