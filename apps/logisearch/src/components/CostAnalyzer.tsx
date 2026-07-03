import { useState } from 'react'
import {
  Box, Card, Typography, TextField, Button, Stack, Slider, Chip, Grid,
} from '@mui/material'
import {
  Calculate as CalcIcon, AttachMoney as MoneyIcon,
} from '@mui/icons-material'
import { alpha } from '@mui/material/styles'

const MODE_RATES = {
  mar: { label: 'Marítimo', symbol: 'USD', color: '#00E5FF', rate: 0.35 },
  aire: { label: 'Aéreo', symbol: 'USD', color: '#00B8D4', rate: 4.50 },
  tierra: { label: 'Terrestre', symbol: 'EUR', color: '#06b6d4', rate: 1.50 },
}

export default function CostAnalyzer() {
  const [mode, setMode] = useState<'mar' | 'aire' | 'tierra'>('mar')
  const [costPerUnit, setCostPerUnit] = useState(0)
  const [units, setUnits] = useState(100)
  const [unitType, setUnitType] = useState<'pallet' | 'caja' | 'unidad'>('caja')
  const [margin, setMargin] = useState(15)
  const [shipmentCost, setShipmentCost] = useState(3500)
  const [result, setResult] = useState<{
    subtotal: number; freightEach: number; marginAmount: number; totalPerUnit: number; grandTotal: number
  } | null>(null)

  const m = MODE_RATES[mode]

  const handleCalc = () => {
    const safeUnits = units > 0 ? units : 1
    const subtotal = costPerUnit * safeUnits
    const freightEach = shipmentCost / safeUnits
    const marginAmount = (subtotal + shipmentCost) * (margin / 100)
    const grandTotal = subtotal + shipmentCost + marginAmount
    const totalPerUnit = grandTotal / safeUnits
    setResult({ subtotal, freightEach, marginAmount, totalPerUnit, grandTotal })
  }

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <MoneyIcon sx={{ color: 'primary.main' }} />
        Coste por {unitType === 'pallet' ? 'Pallet' : unitType === 'caja' ? 'Caja' : 'Unidad'}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        {(['mar', 'aire', 'tierra'] as const).map(md => (
          <Chip
            key={md}
            label={MODE_RATES[md].label}
            color={mode === md ? 'primary' : 'default'}
            variant={mode === md ? 'filled' : 'outlined'}
            onClick={() => setMode(md)}
          />
        ))}
        {(['pallet', 'caja', 'unidad'] as const).map(ut => (
          <Chip
            key={ut}
            label={ut.charAt(0).toUpperCase() + ut.slice(1)}
            color={unitType === ut ? 'primary' : 'default'}
            variant={unitType === ut ? 'filled' : 'outlined'}
            onClick={() => setUnitType(ut)}
          />
        ))}
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField fullWidth size="small" label={`Coste/${unitType} (${m.symbol})`} type="number"
            value={costPerUnit || ''} onChange={e => setCostPerUnit(parseFloat(e.target.value) || 0)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField fullWidth size="small" label={`Nº ${unitType === 'unidad' ? 'unidades' : unitType === 'caja' ? 'cajas' : 'palets'}`} type="number"
            value={units} onChange={e => setUnits(Math.max(1, parseInt(e.target.value) || 1))} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField fullWidth size="small" label={`Flete total (${m.symbol})`} type="number"
            value={shipmentCost} onChange={e => setShipmentCost(Math.max(0, parseFloat(e.target.value) || 0))} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField fullWidth size="small" label="Margen (%)" type="number"
            value={margin} onChange={e => setMargin(Math.max(0, parseFloat(e.target.value) || 0))} />
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
          Margen: {margin}%
        </Typography>
        <Slider value={margin} onChange={(_, v) => setMargin(v as number)} min={0} max={100} step={1}
          valueLabelDisplay="auto" valueLabelFormat={v => `${v}%`} />
      </Box>

      <Button variant="contained" onClick={handleCalc} startIcon={<CalcIcon />} fullWidth sx={{ mt: 2, mb: 3 }}>
        Calcular coste
      </Button>

      {result && (
        <Box sx={{ p: 3, borderRadius: 2, border: '2px solid', borderColor: alpha(m.color, 0.4), bgcolor: alpha(m.color, 0.06) }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="overline" sx={{ color: 'text.disabled' }}>Subtotal</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{m.symbol} {result.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="overline" sx={{ color: 'text.disabled' }}>Flete/{unitType}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.light' }}>{m.symbol} {result.freightEach.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="overline" sx={{ color: 'text.disabled' }}>Margen</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>{m.symbol} {result.marginAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="overline" sx={{ color: 'text.disabled' }}>Total/{unitType}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: m.color }}>{m.symbol} {result.totalPerUnit.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="overline" sx={{ color: 'text.disabled' }}>COSTE TOTAL DEL ENVÍO</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, background: 'linear-gradient(135deg, #00E5FF, #00B8D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {m.symbol} {result.grandTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Box>
      )}
    </Card>
  )
}
