import {
  Box, Card, CardContent, Typography, Chip, Grid,
  Rating, Button, Divider, Stack, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material'
import {
  DirectionsBoat as ShipIcon,
  Flight as PlaneIcon,
  LocalShipping as TruckIcon,
  ArrowForward as ArrowIcon,
  Email as MailIcon,
  AccessTime as ClockIcon,
  Public as GlobeIcon,
  CheckCircle as CheckIcon,
  Wifi as WifiIcon,
  Description as FileTextIcon,
  AttachMoney as DollarIcon,
  Group as UsersIcon,
  Star as StarIcon,
  TrendingUp as TrendIcon,
  Gavel as GavelIcon,
  Warning as WarningIcon,
  School as ExpertIcon,
  AutoAwesome as SparklesIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { alpha } from '@mui/material/styles'
import ReactMarkdown from 'react-markdown'

// Motion-wrapped MUI components
const MotionCard = motion.create(Card)

interface ResultsViewProps {
  origin: string
  destination: string
  mode: string
  searchMode?: 'route' | 'expert' | 'general'
  onGenerateRFQ: () => void
  aiResults?: {
    route: Record<string, unknown> | null
    carriers: Array<Record<string, unknown>>
    regulations: Record<string, unknown> | null
    webData: {
      freightData: Record<string, unknown> | null
      customsData: Record<string, unknown> | null
    }
    rfq: string | null
    expertData: string | null
  }
}

// Incoterms reference data
const INCOTERMS = [
  { code: 'CIF', name: 'Coste, Seguro y Flete', seller: 'Flete + Seguro', buyer: 'Descarga + Aduana' },
  { code: 'FOB', name: 'Franco a Bordo', seller: 'Entrega a bordo', buyer: 'Flete + Aduana' },
  { code: 'EXW', name: 'En Fábrica', seller: 'Mercancía en origen', buyer: 'Todo transporte' },
  { code: 'DDP', name: 'Entregado con Derechos Pagados', seller: 'Todo incluido', buyer: 'Solo recepción' },
]

// Required documents
const DOCUMENTS = [
  { name: 'Conocimiento de Embarque (B/L)', required: true },
  { name: 'Lista de Empaque', required: true },
  { name: 'Factura Comercial', required: true },
  { name: 'Certificado de Origen', required: false },
  { name: 'Seguro (110% CIF)', required: true },
]

const MODE_CONFIG: Record<string, { icon: typeof ShipIcon; label: string; color: string }> = {
  mar: { icon: ShipIcon, label: 'Marítimo', color: '#00E5FF' },
  aire: { icon: PlaneIcon, label: 'Aéreo', color: '#22D3EE' },
  tierra: { icon: TruckIcon, label: 'Terrestre', color: '#06B6D4' },
}

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  }),
}

export default function ResultsView({ origin, destination, mode, searchMode = 'expert', onGenerateRFQ, aiResults }: ResultsViewProps) {
  const modeConfig = MODE_CONFIG[mode] || MODE_CONFIG.mar
  const ModeIcon = modeConfig.icon

  const routeData = aiResults?.route as Record<string, unknown> | null
  const carriers = (aiResults?.carriers as Array<Record<string, unknown>>) || []
  const regulations = aiResults?.regulations as Record<string, unknown> | null
  const hasRealData = !!routeData || carriers.length > 0

  // Extract data from AI analysis
  const estimatedCost = routeData?.estimatedCost as Record<string, string> | undefined
  const considerations = (routeData?.considerations as string[]) || []
  const shipmentType = (routeData?.type as string) || (regulations?.shipmentType as string) || 'international'
  const routeRegulations = routeData?.regulations as Record<string, unknown> | null
  const requiredDocs = (routeRegulations?.requiredDocuments as string[]) || (regulations?.requiredDocuments as Array<Record<string, unknown>>) || []
  const applicableRegs = (routeRegulations?.applicableRegulations as string[]) || (regulations?.applicableRegulations as Array<Record<string, unknown>>) || []
  const expertData = aiResults?.expertData

  if (expertData) {
    const isExpert = searchMode === 'expert'
    const TitleIcon = isExpert ? SparklesIcon : GlobeIcon
    const BgIcon = isExpert ? ExpertIcon : GlobeIcon
    const titleText = isExpert ? 'Análisis Experto' : 'Respuesta General'
    const primaryColor = isExpert ? '#22D3EE' : '#06B6D4'

    return (
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ p: { xs: 2, md: 4 }, position: 'relative', overflow: 'hidden' }}
      >
        <Box sx={{ position: 'absolute', top: -50, right: -50, opacity: 0.1, pointerEvents: 'none' }}>
          <BgIcon sx={{ fontSize: 240, color: 'primary.dark' }} />
        </Box>
        <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, color: primaryColor }}>
          <TitleIcon />
          {titleText}
        </Typography>
        <Box sx={{ 
          fontSize: '1.05rem', 
          lineHeight: 1.7,
          color: 'text.primary',
          '& h1, & h2, & h3': { color: 'white', fontWeight: 600, mt: 4, mb: 2 },
          '& h1': { fontSize: '1.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1 },
          '& h2': { fontSize: '1.4rem' },
          '& h3': { fontSize: '1.2rem', color: primaryColor },
          '& p': { mb: 2 },
          '& ul, & ol': { pl: 3, mb: 2 },
          '& li': { mb: 1, '&::marker': { color: isExpert ? 'primary.main' : '#06B6D4' } },
          '& strong': { color: 'white', fontWeight: 700 },
          '& code': { bgcolor: 'rgba(255,255,255,0.1)', px: 1, py: 0.2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.9em' },
          '& a': { color: '#00E5FF', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
        }}>
          <ReactMarkdown>{expertData}</ReactMarkdown>
        </Box>
      </MotionCard>
    )
  }

  return (
    <Stack spacing={2.5}>
      {/* ─── Route Header ─── */}
      <MotionCard
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        sx={{
          p: { xs: 2, md: 3 },
          borderLeft: `4px solid ${modeConfig.color}`,
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 52, height: 52, borderRadius: 3,
                background: `linear-gradient(135deg, ${modeConfig.color}, ${alpha(modeConfig.color, 0.7)})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ModeIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {origin}
                <ArrowIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                {destination}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {modeConfig.label} · {(routeData?.transitTime as string) || 'Datos de ruta no disponibles'}
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            {hasRealData && (
              <Chip
                icon={<WifiIcon sx={{ fontSize: 14 }} />}
                label="Datos IA"
                color="primary"
                size="small"
              />
            )}
            <Button
              variant="contained"
              startIcon={<MailIcon />}
              onClick={onGenerateRFQ}
              size="medium"
            >
              Generar RFQ
            </Button>
          </Stack>
        </Box>
      </MotionCard>

      {/* ─── Stats Grid ─── */}
      <Grid container spacing={2}>
        {[
          { label: 'Origen', value: origin, icon: GlobeIcon },
          { label: 'Destino', value: destination, icon: ArrowIcon },
          { label: 'Tránsito', value: (routeData?.transitTime as string) || '—', icon: ClockIcon, highlight: true },
          { label: 'Distancia', value: (routeData?.distance as string) || '—', icon: TrendIcon },
        ].map((item, idx) => (
          <Grid key={item.label} size={{ xs: 6, md: 3 }}>
            <MotionCard
              custom={idx + 1}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              sx={{
                p: 2.5,
                height: '100%',
                ...(item.highlight && { borderColor: alpha('#00E5FF', 0.3) }),
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <item.icon sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="overline" sx={{ color: 'text.disabled', lineHeight: 1 }}>
                  {item.label}
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: item.highlight ? 'primary.main' : 'white',
                  textTransform: 'capitalize',
                }}
              >
                {item.value}
              </Typography>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {/* ─── AI Analysis (Considerations) ─── */}
      {considerations.length > 0 && (
        <MotionCard custom={5} initial="hidden" animate="visible" variants={cardVariants}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <StarIcon sx={{ color: 'primary.main' }} />
              Análisis IA de la Ruta
            </Typography>
            <Stack spacing={1.5}>
              {considerations.map((item: string, idx: number) => (
                <Box key={idx} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <CheckIcon sx={{ color: 'primary.main', fontSize: 18, mt: 0.25 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </MotionCard>
      )}

      {/* ─── Cost Estimate ─── */}
      <MotionCard custom={6} initial="hidden" animate="visible" variants={cardVariants}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <DollarIcon sx={{ color: 'primary.main' }} />
            Estimación de Costos
          </Typography>

          {estimatedCost ? (
            <Grid container spacing={3}>
              {Object.entries(estimatedCost).map(([key, value]) => (
                <Grid key={key} size={{ xs: 6, md: 3 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: 'rgba(255,255,255,0.04)',
                      borderRadius: 2,
                      textAlign: 'center',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                      {key}
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        background: 'linear-gradient(135deg, #00E5FF, #00B8D4)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 700,
                      }}
                    >
                      {value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Solicita un RFQ para obtener una cotización detallada con precios reales.
              </Typography>
              <Button variant="outlined" startIcon={<MailIcon />} onClick={onGenerateRFQ} sx={{ mt: 2 }}>
                Generar solicitud de cotización
              </Button>
            </Box>
          )}
        </CardContent>
      </MotionCard>

      {/* ─── Incoterms ─── */}
      <MotionCard custom={7} initial="hidden" animate="visible" variants={cardVariants}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileTextIcon sx={{ color: 'primary.main' }} />
            Incoterms 2020
          </Typography>

          <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.main', borderColor: 'divider' }}>Incoterm</TableCell>
                  <TableCell sx={{ fontWeight: 600, borderColor: 'divider' }}>Descripción</TableCell>
                  <TableCell sx={{ fontWeight: 600, borderColor: 'divider' }}>Vendedor</TableCell>
                  <TableCell sx={{ fontWeight: 600, borderColor: 'divider' }}>Comprador</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {INCOTERMS.map((r) => (
                  <TableRow key={r.code} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                    <TableCell sx={{ borderColor: 'divider' }}>
                      <Chip label={r.code} color="primary" size="small" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', borderColor: 'divider' }}>{r.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', borderColor: 'divider' }}>{r.seller}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', borderColor: 'divider' }}>{r.buyer}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </MotionCard>

      {/* ─── Regulations & Compliance ─── */}
      {(requiredDocs.length > 0 || applicableRegs.length > 0) && (
        <MotionCard custom={8} initial="hidden" animate="visible" variants={cardVariants}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GavelIcon sx={{ color: 'primary.main' }} />
                Regulaciones y Cumplimiento Normativo
              </Typography>
              <Chip
                label={shipmentType === 'national' ? 'Nacional' : 'Internacional'}
                color={shipmentType === 'national' ? 'success' : 'primary'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            {/* Required documents from AI */}
            {requiredDocs.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  Documentación Requerida
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {requiredDocs.map((doc, idx) => {
                    const docName = typeof doc === 'string' ? doc : (doc as Record<string, unknown>).name as string
                    const mandatory = typeof doc === 'string' ? true : (doc as Record<string, unknown>).mandatory !== false
                    return (
                      <Tooltip key={idx} title={mandatory ? 'Obligatorio' : 'Opcional'} arrow>
                        <Chip
                          icon={mandatory ? <CheckIcon sx={{ fontSize: 14 }} /> : undefined}
                          label={docName}
                          color={mandatory ? 'primary' : 'default'}
                          variant={mandatory ? 'filled' : 'outlined'}
                          size="small"
                          sx={{
                            ...(!mandatory && {
                              borderColor: 'rgba(255,255,255,0.15)',
                              color: 'text.disabled',
                            }),
                          }}
                        />
                      </Tooltip>
                    )
                  })}
                </Box>
              </Box>
            )}

            {/* Applicable regulations from AI */}
            {applicableRegs.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  Normativa Aplicable
                </Typography>
                <Stack spacing={1}>
                  {applicableRegs.map((reg, idx) => {
                    const regName = typeof reg === 'string' ? reg : (reg as Record<string, unknown>).name as string
                    const regRef = typeof reg === 'string' ? '' : (reg as Record<string, unknown>).reference as string
                    return (
                      <Box key={idx} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <GavelIcon sx={{ color: 'primary.main', fontSize: 16, mt: 0.25 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                            {regName}
                          </Typography>
                          {regRef && (
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              {regRef}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )
                  })}
                </Stack>
              </Box>
            )}

            {/* Risks from route analysis */}
            {(routeData?.risks as string[])?.length > 0 && (
              <Box sx={{ mt: 2.5 }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Riesgos Identificados
                </Typography>
                <Stack spacing={0.5}>
                  {(routeData?.risks as string[]).map((risk, idx) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <WarningIcon sx={{ color: 'primary.light', fontSize: 14 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{risk}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </MotionCard>
      )}

      {/* ─── Fallback static documentation if no AI data ─── */}
      {requiredDocs.length === 0 && (
        <MotionCard custom={8} initial="hidden" animate="visible" variants={cardVariants}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon sx={{ color: 'primary.main' }} />
              Documentación Requerida
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {DOCUMENTS.map((doc) => (
                <Tooltip key={doc.name} title={doc.required ? 'Obligatorio' : 'Opcional'} arrow>
                  <Chip
                    icon={doc.required ? <CheckIcon sx={{ fontSize: 14 }} /> : undefined}
                    label={doc.name}
                    color={doc.required ? 'primary' : 'default'}
                    variant={doc.required ? 'filled' : 'outlined'}
                    size="small"
                    sx={{
                      ...(!doc.required && {
                        borderColor: 'rgba(255,255,255,0.15)',
                        color: 'text.disabled',
                      }),
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </CardContent>
        </MotionCard>
      )}

      {/* ─── Carriers ─── */}
      <MotionCard custom={9} initial="hidden" animate="visible" variants={cardVariants}>
        <CardContent>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <UsersIcon sx={{ color: 'primary.main' }} />
              Transportistas Recomendados
            </Typography>
            {carriers.length > 0 && (
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<FileTextIcon />}
                onClick={() => {
                  const header = ['Transportista', 'Rating', 'Tiempo de Tránsito', 'Precio'];
                  const rows = carriers.map(c => [
                    `"${(c.name as string || '').replace(/"/g, '""')}"`, 
                    Number(c.rating) || 4, 
                    `"${(c.transitTime as string || '').replace(/"/g, '""')}"`, 
                    `"${(c.priceLevel as string || c.price as string || '').replace(/"/g, '""')}"`
                  ].join(','));
                  const csv = [header.join(','), ...rows].join('\n');
                  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `transportistas_${origin.replace(/[^a-z0-9]/gi, '_')}_${destination.replace(/[^a-z0-9]/gi, '_')}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Exportar CSV
              </Button>
            )}
          </Box>

          {carriers.length > 0 ? (
            <Grid container spacing={2}>
              {carriers.slice(0, 5).map((carrier, idx) => (
                <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      p: 2.5,
                      bgcolor: 'rgba(255,255,255,0.04)',
                      border: '1px solid',
                      borderColor: idx === 0 ? alpha('#00E5FF', 0.3) : 'divider',
                      '&:hover': {
                        borderColor: alpha('#00E5FF', 0.5),
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 700, color: 'white' }}>
                        {carrier.name as string}
                      </Typography>
                      <Chip
                        label={`#${idx + 1}`}
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Rating
                        value={Number(carrier.rating) || 4}
                        precision={0.5}
                        size="small"
                        readOnly
                      />
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        {carrier.rating as string || '4.0'}
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 1.5 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ClockIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {(carrier.transitTime as string) || '—'}
                        </Typography>
                      </Box>
                      <Typography sx={{ color: 'primary.main', fontWeight: 700 }}>
                        {(carrier.priceLevel as string) || (carrier.price as string) || '$$'}
                      </Typography>
                    </Box>

                    {/* Strengths */}
                    {(carrier.strengths as string[] || carrier.recommendedServices as string[])?.length > 0 && (
                      <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {((carrier.strengths as string[]) || (carrier.recommendedServices as string[]))?.slice(0, 2).map((s: string, si: number) => (
                          <Chip key={si} label={s} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 22, borderColor: 'rgba(255,255,255,0.1)' }} />
                        ))}
                      </Box>
                    )}
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No se encontraron datos de transportistas para esta ruta.
              </Typography>
            </Box>
          )}
        </CardContent>
      </MotionCard>

      {/* ─── Actions ─── */}
      <MotionCard custom={11} initial="hidden" animate="visible" variants={cardVariants} sx={{ p: 0 }}>
        <Button
          variant="contained"
          startIcon={<MailIcon />}
          onClick={onGenerateRFQ}
          fullWidth
          size="large"
          sx={{ py: 2, fontSize: '1.05rem' }}
        >
          Generar Solicitud de Cotización (RFQ)
        </Button>
      </MotionCard>
    </Stack>
  )
}
