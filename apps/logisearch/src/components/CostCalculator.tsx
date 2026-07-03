import { useState } from 'react'
import {
    Box, Card, CardContent, Typography, TextField,
    Select, MenuItem, FormControl, InputLabel, Button,
    Stack, Divider, Chip, Grid,
} from '@mui/material'
import {
    Calculate as CalcIcon,
    TrendingUp as TrendIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { alpha } from '@mui/material/styles'

const MotionCard = motion.create(Card)

type RateConfig = { min: number; max: number; unit: string }

// Base rates per transport mode (USD per unit, averaged market data)
const BASE_RATES: Record<string, Record<string, RateConfig>> = {
    mar: {
        '20ft': { min: 800, max: 3500, unit: 'USD/TEU' },
        '40ft': { min: 1200, max: 5500, unit: 'USD/FEU' },
        '40hc': { min: 1400, max: 6000, unit: 'USD/FEU' },
        'lcl': { min: 35, max: 120, unit: 'USD/CBM' },
    },
    aire: {
        'general': { min: 2.5, max: 8.0, unit: 'USD/kg' },
        'express': { min: 5.0, max: 15.0, unit: 'USD/kg' },
        'pallet': { min: 200, max: 800, unit: 'USD/pallet' },
    },
    tierra: {
        'ftl': { min: 0.8, max: 2.5, unit: 'EUR/km' },
        'ltl': { min: 30, max: 90, unit: 'EUR/pallet' },
        'express': { min: 1.5, max: 4.0, unit: 'EUR/km' },
    },
}

const SURCHARGES = [
    { name: 'BAF (Recargo de combustible marítimo)', rate: 0.08, modes: ['mar'] },
    { name: 'THC (Manipulación en terminal)', rate: 0.05, modes: ['mar'] },
    { name: 'Despacho aduanero', rate: 0.03, modes: ['mar', 'aire'] },
    { name: 'Seguro (110% CIF)', rate: 0.015, modes: ['mar', 'aire', 'tierra'] },
    { name: 'Recargo combustible', rate: 0.12, modes: ['aire'] },
    { name: 'Peajes', rate: 0.04, modes: ['tierra'] },
]

interface CostCalculatorProps {
    defaultMode?: string
    defaultOrigin?: string
    defaultDestination?: string
}

export default function CostCalculator({ defaultMode = 'mar' }: CostCalculatorProps) {
    const [mode, setMode] = useState(defaultMode)
    const [containerType, setContainerType] = useState(mode === 'mar' ? '40ft' : mode === 'aire' ? 'general' : 'ftl')
    const [quantity, setQuantity] = useState(1)
    const [distance, setDistance] = useState(5000)
    const [calculated, setCalculated] = useState(false)
    const [result, setResult] = useState<{
        baseCost: number
        surcharges: { name: string; amount: number }[]
        total: number
        perUnit: string
        suggestedCarriers: { name: string; website: string; phone: string }[]
    } | null>(null)

    const CARRIER_DB = {
        mar: [
            { name: 'Maersk Line', website: 'https://www.maersk.com', phone: '+34 902 284 828' },
            { name: 'MSC', website: 'https://www.msc.com', phone: '+34 963 359 100' },
            { name: 'CMA CGM', website: 'https://www.cma-cgm.com', phone: '+34 934 956 200' },
        ],
        aire: [
            { name: 'DHL Aviation', website: 'https://www.dhl.com', phone: '+34 902 122 424' },
            { name: 'FedEx Express', website: 'https://www.fedex.com', phone: '+34 915 209 060' },
            { name: 'Lufthansa Cargo', website: 'https://lufthansa-cargo.com', phone: '+34 917 482 100' },
        ],
        tierra: [
            { name: 'DB Schenker', website: 'https://www.dbschenker.com', phone: '+34 911 313 000' },
            { name: 'DSV', website: 'https://www.dsv.com', phone: '+34 934 797 200' },
            { name: 'XPO Logistics', website: 'https://www.xpo.com', phone: '+34 902 102 102' },
        ]
    }

    const handleCalculate = () => {
        const rates = BASE_RATES[mode as keyof typeof BASE_RATES]
        if (!rates) return

        const rateConfig = rates?.[containerType]
        if (!rateConfig) return

        // Calculate base cost depending on rate type
        const avgRate = (rateConfig.min + rateConfig.max) / 2
        const unit = rateConfig.unit

        let baseCost: number
        if (unit.includes('/km')) {
            // Per-km rates: rate × distance × quantity (number of trucks)
            baseCost = avgRate * distance * quantity
        } else if (unit.includes('/kg')) {
            // Per-kg rates: rate × quantity (kg), distance adjusts price
            const distanceFactor = Math.max(0.8, Math.min(1.6, distance / 5000))
            baseCost = avgRate * quantity * distanceFactor
        } else if (unit.includes('/pallet')) {
            // Per-pallet rates: rate × quantity, distance adjusts
            const distanceFactor = Math.max(0.7, Math.min(1.5, distance / 3000))
            baseCost = avgRate * quantity * distanceFactor
        } else if (unit.includes('/CBM')) {
            // Per-CBM rates: rate × quantity CBMs, distance adjusts
            const distanceFactor = Math.max(0.8, Math.min(1.4, distance / 10000))
            baseCost = avgRate * quantity * distanceFactor
        } else {
            // Container rates (TEU/FEU): rate × quantity, distance adjusts
            const distanceFactor = Math.max(0.7, Math.min(1.5, distance / 10000))
            baseCost = avgRate * quantity * distanceFactor
        }

        // Calculate surcharges
        const applicableSurcharges = SURCHARGES
            .filter(s => s.modes.includes(mode))
            .map(s => ({
                name: s.name,
                amount: Math.round(baseCost * s.rate),
            }))

        const totalSurcharges = applicableSurcharges.reduce((sum, s) => sum + s.amount, 0)
        const total = Math.round(baseCost + totalSurcharges)

        setResult({
            baseCost: Math.round(baseCost),
            surcharges: applicableSurcharges,
            total,
            perUnit: rateConfig.unit,
            suggestedCarriers: CARRIER_DB[mode as keyof typeof CARRIER_DB]
        })
        setCalculated(true)
    }

    const modeOptions = {
        mar: ['20ft', '40ft', '40hc', 'lcl'],
        aire: ['general', 'express', 'pallet'],
        tierra: ['ftl', 'ltl', 'express'],
    }

    const containerLabels: Record<string, string> = {
        '20ft': 'Contenedor 20ft (TEU)',
        '40ft': 'Contenedor 40ft (FEU)',
        '40hc': 'Contenedor 40ft High Cube',
        'lcl': 'Grupaje (LCL) por CBM',
        'general': 'Carga general (por kg)',
        'express': 'Express / Urgente',
        'pallet': 'Pallet aéreo',
        'ftl': 'Camión completo (FTL)',
        'ltl': 'Carga parcial (LTL/pallet)',
    }

    return (
        <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalcIcon sx={{ color: 'primary.main' }} />
                    Calculadora de Costos
                </Typography>

                <Grid container spacing={2}>
                    {/* Mode selector */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Modalidad</InputLabel>
                            <Select
                                value={mode}
                                label="Modalidad"
                                onChange={(e) => {
                                    setMode(e.target.value)
                                    setContainerType(modeOptions[e.target.value as keyof typeof modeOptions]?.[0] || '')
                                    setCalculated(false)
                                }}
                            >
                                <MenuItem value="mar">Marítimo</MenuItem>
                                <MenuItem value="aire">Aéreo</MenuItem>
                                <MenuItem value="tierra">Terrestre</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Container type */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={containerType}
                                label="Tipo"
                                onChange={(e) => {
                                    setContainerType(e.target.value)
                                    setCalculated(false)
                                }}
                            >
                                {modeOptions[mode as keyof typeof modeOptions]?.map((opt) => (
                                    <MenuItem key={opt} value={opt}>{containerLabels[opt] || opt}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Quantity */}
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label={
                                containerType === 'general' || containerType === 'express' && mode === 'aire'
                                    ? 'Peso (kg)'
                                    : containerType === 'lcl'
                                        ? 'Volumen (CBM)'
                                        : containerType === 'pallet' || containerType === 'ltl'
                                            ? 'Nº Palets'
                                            : 'Cantidad'
                            }
                            type="number"
                            value={quantity}
                            onChange={(e) => { setQuantity(Math.max(1, parseInt(e.target.value) || 1)); setCalculated(false) }}
                            slotProps={{ htmlInput: { min: 1 } }}
                        />
                    </Grid>

                    {/* Distance */}
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Distancia (km)"
                            type="number"
                            value={distance}
                            onChange={(e) => { setDistance(Math.max(1, parseInt(e.target.value) || 1)); setCalculated(false) }}
                            slotProps={{ htmlInput: { min: 1 } }}
                        />
                    </Grid>

                    {/* Calculate button */}
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleCalculate}
                            startIcon={<CalcIcon />}
                            sx={{ height: 40 }}
                        >
                            Calcular
                        </Button>
                    </Grid>
                </Grid>

                {/* Results */}
                {calculated && result && (
                    <Box sx={{ mt: 3 }}>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            {/* Base cost */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'rgba(255,255,255,0.04)',
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                                        Costo base
                                    </Typography>
                                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                                        {result.baseCost.toLocaleString('es-ES')} {mode === 'tierra' ? 'EUR' : 'USD'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                        {result.perUnit}
                                    </Typography>
                                </Box>
                            </Grid>

                            {/* Surcharges */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'rgba(255,255,255,0.04)',
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                >
                                    <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
                                        Recargos
                                    </Typography>
                                    <Stack spacing={0.5}>
                                        {result.surcharges.map((s) => (
                                            <Box key={s.name} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    {s.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                                                    +{s.amount.toLocaleString('es-ES')}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            </Grid>

                            {/* Total */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        border: '2px solid',
                                        borderColor: alpha('#00E5FF', 0.5),
                                        bgcolor: alpha('#00E5FF', 0.08),
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                                        Total estimado
                                    </Typography>
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            background: 'linear-gradient(135deg, #00E5FF, #00B8D4)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            fontWeight: 800,
                                        }}
                                    >
                                        {result.total.toLocaleString('es-ES')} {mode === 'tierra' ? 'EUR' : 'USD'}
                                    </Typography>
                                    <Chip
                                        icon={<TrendIcon sx={{ fontSize: 14 }} />}
                                        label="Precio de mercado"
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{ mt: 1 }}
                                    />
                                </Box>
                            </Grid>

                            {/* Suggested Carriers */}
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', mb: 1.5 }}>
                                        Operadores recomendados en esta ruta
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {result.suggestedCarriers.map((carrier, idx) => (
                                            <Grid key={idx} size={{ xs: 12, sm: 4 }}>
                                                <Card sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.5)', border: '1px solid', borderColor: 'rgba(255,255,255,0.1)' }}>
                                                    <Typography sx={{ fontWeight: 700, color: 'white', mb: 0.5, fontSize: '0.9rem' }}>
                                                        {carrier.name}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                        <Button
                                                            size="small"
                                                            variant="text"
                                                            href={carrier.website}
                                                            target="_blank"
                                                            sx={{ justifyContent: 'flex-start', p: 0, minWidth: 0, fontSize: '0.75rem', color: '#00E5FF' }}
                                                        >
                                                            {carrier.website.replace('https://www.', '')}
                                                        </Button>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            {carrier.phone}
                                                        </Typography>
                                                    </Box>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            </Grid>
                        </Grid>

                        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 2, textAlign: 'center' }}>
                            * Estimación basada en tarifas de mercado actuales. Los precios finales pueden variar según el transportista y las condiciones del envío.
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </MotionCard>
    )
}
