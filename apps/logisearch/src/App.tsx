import { useState, useCallback } from 'react'
import {
  AppBar, Toolbar, Container, Box, Typography, TextField, Button,
  Chip, Card, Snackbar, Alert, Tooltip, Tabs, Tab, Fade, Stack,
} from '@mui/material'
import {
  Anchor as AnchorIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  Wifi as WifiIcon,
  TravelExplore as SmartIcon,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import ResultsView from './components/ResultsView'
import RfqDialog from './components/RfqDialog'
import SearchHistory from './components/SearchHistory'
import CostCalculator from './components/CostCalculator'
import ContainerTracker from './components/ContainerTracker'
import VesselTracker from './components/VesselTracker'
import CbmCalculator from './components/CbmCalculator'
import CostAnalyzer from './components/CostAnalyzer'
import DunnageGuide from './components/DunnageGuide'
import EmailTemplates from './components/EmailTemplates'
import ToolSelector from './components/ToolSelector'
import { saveSearch, saveRFQ } from './lib/storage'
import { createTrelloCard } from './services/trello'
import GlobalAlerts from './components/GlobalAlerts'
import CreativeStudio from './components/CreativeStudio'
import VoiceWidget from './components/VoiceWidget'
import { searchFreightRates, searchCustomsRequirements } from './services/tavily'
import { analyzeRoute, compareCarriers, generateCustomRFQ, analyzeRegulations, askExpert, askGeneral } from './services/gemini'
import { detectIntent } from './services/intentDetection'

const MotionBox = motion.create(Box)

const QUICK_EXAMPLES = [
  { label: 'Shenzhen → Barcelona marítimo', tool: 'route' },
  { label: 'Normativa ADR mercancías peligrosas', tool: 'expert' },
  { label: 'MSCU4820485', tool: 'container' },
  { label: 'MSC IRINA', tool: 'vessel' },
  { label: 'CBM 40HC 20 palets', tool: 'cbm' },
  { label: 'Coste por pallet marítimo', tool: 'cost' },
  { label: 'Plantilla email negociación tarifa', tool: 'email' },
  { label: 'Shanghai → LA 40HC', tool: 'route' },
]

interface SearchResults {
  route: Record<string, unknown> | null
  carriers: Record<string, unknown>[]
  regulations: Record<string, unknown> | null
  webData: {
    freightData: Record<string, unknown> | null
    customsData: Record<string, unknown> | null
  }
  rfq: string | null
  expertData: string | null
}

const parseQuery = (text: string) => {
  const lower = text.toLowerCase()
  let mode: 'mar' | 'aire' | 'tierra' = 'mar'
  if (lower.includes('aéreo') || lower.includes('avión') || lower.includes('air') || lower.includes('fly')) mode = 'aire'
  else if (lower.includes('terrestre') || lower.includes('camión') || lower.includes('truck') || lower.includes('tren') || lower.includes('carretera') || lower.includes('road') || lower.includes('furgoneta')) mode = 'tierra'
  let origin = ''; let destination = ''
  const deMatch = lower.match(/de\s+([a-záéíóúñü\s,]+?)\s+a\s+([a-záéíóúñü\s,]+?)(?:\s+por|\s+en|\s+vía|\s+marítimo|\s+aéreo|\s+terrestre|$)/i)
  const fromMatch = lower.match(/from\s+([a-z\s,]+?)\s+to\s+([a-z\s,]+?)(?:\s+by|\s+via|$)/i)
  if (deMatch) { origin = deMatch[1].trim(); destination = deMatch[2].trim() }
  else if (fromMatch) { origin = fromMatch[1].trim(); destination = fromMatch[2].trim() }
  else {
    const arrowMatch = text.match(/^([^→\->]+?)\s*[→\->]+\s*(.+?)(?:\s+(?:por|marítimo|mar|aéreo|terrestre|air|sea|road|truck)\s*.*)?$/i)
    if (arrowMatch) { origin = arrowMatch[1].trim(); destination = arrowMatch[2].trim() }
  }
  return { origin: origin || 'Origen', destination: destination || 'Destino', mode }
}

function App() {
  const [query, setQuery] = useState('')
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [searchMode, setSearchMode] = useState<'route' | 'expert' | 'general'>('route')
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [showRFQ, setShowRFQ] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [lastSearchId, setLastSearchId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const isHome = !activeTool
  const isAiSearch = activeTool === 'route' || activeTool === 'expert' || activeTool === 'general'

  const handleToolSelect = useCallback((toolId: string) => {
    setActiveTool(toolId)
    setHasSearched(false)
    setSearchResults(null)
    if (toolId === 'route' || toolId === 'expert' || toolId === 'general') {
      setSearchMode(toolId as 'route' | 'expert' | 'general')
    }
  }, [])

  const handleHome = useCallback(() => {
    setActiveTool(null)
    setHasSearched(false)
    setSearchResults(null)
    setQuery('')
  }, [])

  const handleSearch = useCallback(async (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return
    if (!query.trim()) return
    const detected = detectIntent(query)
    if (detected.intent === 'container') { setActiveTool('container'); return }
    if (detected.intent === 'vessel') { setActiveTool('vessel'); return }
    if (detected.intent === 'cbm') { setActiveTool('cbm'); return }
    if (detected.intent === 'cost') { setActiveTool('cost'); return }
    if (detected.intent === 'dunnage') { setActiveTool('dunnage'); return }
    if (detected.intent === 'email') { setActiveTool('email'); return }
    setIsLoading(true); setError(null); setLastSearchId(null)
    const { origin, destination, mode } = parseQuery(query)
    
    let effectiveSearchMode = searchMode
    if (detected.intent === 'general' && searchMode === 'route') {
      effectiveSearchMode = 'general'
      setActiveTool('general')
      setSearchMode('general')
    }

    try {
      if (effectiveSearchMode === 'expert' || effectiveSearchMode === 'general') {
        const expertResult = effectiveSearchMode === 'expert' ? await askExpert(query) : await askGeneral(query)
        setSearchResults({ route: null, carriers: [], regulations: null, webData: { freightData: null, customsData: null }, rfq: null, expertData: expertResult })
        setHasSearched(true)
        saveSearch({ origin: 'N/A', destination: 'N/A', transport_mode: effectiveSearchMode as any, results: { expertData: expertResult } }).then(saved => { if (saved?.id) setLastSearchId(saved.id) }).catch(() => {})
      } else {
        const [routeResult, freightResult, customsResult, regulationsResult, carriersResult] = await Promise.allSettled([
          analyzeRoute(origin, destination, mode, query),
          searchFreightRates(origin, destination, mode),
          searchCustomsRequirements(origin, destination),
          analyzeRegulations(origin, destination),
          compareCarriers(origin, destination, mode),
        ])
        let rfqText: string | null = null
        try { rfqText = await generateCustomRFQ(origin, destination, mode, query) } catch { console.warn('RFQ gen failed') }
        const routeAnalysis = routeResult.status === 'fulfilled' ? routeResult.value : null
        const freightData = freightResult.status === 'fulfilled' ? freightResult.value : null
        const customsData = customsResult.status === 'fulfilled' ? customsResult.value : null
        const regulations = regulationsResult.status === 'fulfilled' ? regulationsResult.value : null
        const carriers = carriersResult.status === 'fulfilled' ? carriersResult.value : null
        const failedApis = [routeResult, freightResult, customsResult, regulationsResult, carriersResult].filter(r => r.status === 'rejected').length
        const hasAnyData = routeAnalysis || freightData || customsData || regulations || carriers || rfqText
        if (!hasAnyData) setError('No se pudieron obtener datos.')
        else if (failedApis > 0) setError(`${failedApis} de 5 fuentes no respondieron.`)
        saveSearch({ origin, destination, transport_mode: mode, results: { routeAnalysis, freightData, customsData, regulations, carriers } }).then(saved => { if (saved?.id) setLastSearchId(saved.id) }).catch(() => {})
        setSearchResults({ route: routeAnalysis, carriers: carriers || [], regulations, webData: { freightData: freightData as any, customsData: customsData as any }, rfq: rfqText, expertData: null })
        if (hasAnyData) setHasSearched(true)
      }
    } catch (err) { console.error('Search error:', err); setError('Error inesperado.') }
    finally { setIsLoading(false) }
  }, [query, searchMode])

  const handleSaveRFQ = useCallback(async () => {
    if (!searchResults?.rfq || !lastSearchId) return
    const p = parseQuery(query)
    try { 
      await saveRFQ({ search_query_id: lastSearchId, origin: p.origin, destination: p.destination, transport_mode: p.mode, cargo_details: query, status: 'pending' }); 
      
      // Enviar a Trello CRM
      const cardName = `RFQ: ${p.origin} a ${p.destination} (${p.mode.toUpperCase()})`;
      const cardDesc = `**Cargo Details:**\n${query}\n\n**RFQ Draft:**\n${searchResults.rfq}\n\n*Generated by LogiSearch AI CRM Integration*`;
      const trelloSuccess = await createTrelloCard(cardName, cardDesc);
      
      setSuccessMsg(`RFQ guardado${trelloSuccess ? ' y enviado a Trello' : ''}`);
    }
    catch { setError('Error al guardar RFQ') }
  }, [searchResults, lastSearchId, query])

  const p = hasSearched ? parseQuery(query) : null

  const renderToolContent = () => {
    if (!activeTool) return null
    switch (activeTool) {
      case 'container': return <ContainerTracker />
      case 'vessel': return <VesselTracker />
      case 'cbm': return <CbmCalculator />
      case 'cost': return <CostAnalyzer />
      case 'dunnage': return <DunnageGuide />
      case 'email': return <EmailTemplates />
      case 'creative': return <CreativeStudio />
      case 'route': case 'expert': case 'general':
        return hasSearched && p ? <ResultsView origin={p.origin} destination={p.destination} mode={p.mode} searchMode={searchMode} onGenerateRFQ={() => setShowRFQ(true)} aiResults={searchResults ?? undefined} /> : null
      default: return null
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky">
        <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto', px: { xs: 2, md: 3 } }}>
          <Box onClick={handleHome} sx={{ width: 40, height: 40, borderRadius: 2.5, background: 'linear-gradient(135deg, #00E5FF, #00B8D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, cursor: 'pointer' }}>
            <AnchorIcon sx={{ fontSize: 22, color: 'white' }} />
          </Box>
          <Typography variant="h6" onClick={handleHome} sx={{ fontWeight: 800, color: 'white', flexGrow: 0, cursor: 'pointer' }}>LogiSearch</Typography>

          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Historial">
            <Button startIcon={<HistoryIcon />} onClick={() => setShowHistory(true)} sx={{ color: 'text.secondary', '&:hover': { color: 'white' }, mr: 1 }} size="small">Historial</Button>
          </Tooltip>
          {!isHome && <Button startIcon={<SmartIcon />} onClick={handleHome} sx={{ color: 'text.secondary', '&:hover': { color: 'white' } }} size="small">Inicio</Button>}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
        <GlobalAlerts />
        <AnimatePresence mode="wait">
          {isHome ? (
            <MotionBox key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <Stack spacing={4} sx={{ alignItems: 'center' }}>
                <Box sx={{ textAlign: 'center', maxWidth: 750, mx: 'auto' }}>
                  <Typography variant="h1" sx={{ fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' }, mb: 2 }}>
                    Tu <Box component="span" className="text-gradient">hub logístico</Box> inteligente
                  </Typography>
                  <Typography variant="subtitle1">Búsqueda inteligente + herramientas especializadas</Typography>
                </Box>
                <Box className="portal-card" sx={{ width: '100%', maxWidth: 800, p: 0, overflow: 'visible', borderRadius: '20px' }}>
                  <Box className="portal-card-inner" sx={{ p: 0, borderRadius: '18px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(0, 229, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ml: 1 }}>
                      <SmartIcon sx={{ color: 'primary.main' }} />
                    </Box>
                    <TextField fullWidth value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSearch() }} placeholder="Pega un tracking, busca ruta, calcula CBM, rastrea buque..." variant="standard" slotProps={{ input: { disableUnderline: true, sx: { fontSize: '1.05rem', py: 1.5, px: 1, color: 'white' } } }} />
                    <Button variant="contained" onClick={() => handleSearch()} disabled={!query.trim()} sx={{ minWidth: 140, py: 1.5 }} startIcon={isLoading ? undefined : <SearchIcon />}>{isLoading ? '...' : 'Buscar'}</Button>
                  </Box>
                  </Box>
                </Box>
                <Fade in={isLoading} unmountOnExit>
                  <Card sx={{ width: '100%', maxWidth: 650, p: 3, textAlign: 'center' }}><Typography sx={{ color: 'primary.main' }}>Procesando búsqueda con IA...</Typography></Card>
                </Fade>
                {!isLoading && <Box sx={{ textAlign: 'center', width: '100%' }}><Typography variant="caption" sx={{ color: 'text.disabled', mb: 2, display: 'block' }}>O elige una herramienta</Typography><ToolSelector activeTool={null} onSelect={handleToolSelect} /></Box>}
                {!isLoading && <Box sx={{ textAlign: 'center' }}><Typography variant="caption" sx={{ color: 'text.disabled', mb: 2, display: 'block' }}>Prueba con estos ejemplos</Typography><Stack direction="row" sx={{ flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}>{QUICK_EXAMPLES.map(ex => <Chip key={ex.label} label={ex.label} variant="outlined" size="small" onClick={() => { setQuery(ex.label); if (ex.tool !== 'route') handleToolSelect(ex.tool) }} sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary', '&:hover': { borderColor: 'primary.main', color: 'primary.light' }, cursor: 'pointer', mb: 0.5 }} />)}</Stack></Box>}
                {!isLoading && <Box sx={{ width: '100%', pt: 4 }}><CostCalculator defaultMode="mar" /></Box>}
              </Stack>
            </MotionBox>
          ) : (
            <MotionBox key={activeTool} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              {isAiSearch && (
                <Card sx={{ p: 2, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Tabs value={searchMode} onChange={(_, v) => setSearchMode(v)} sx={{ flex: 1, minHeight: 40 }}>
                      <Tab label="Ruta Logística" value="route" sx={{ minHeight: 40, py: 0.5 }} />
                      <Tab label="Consulta Experto" value="expert" sx={{ minHeight: 40, py: 0.5 }} />
                      <Tab label="Búsqueda General" value="general" sx={{ minHeight: 40, py: 0.5 }} />
                    </Tabs>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField size="small" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSearch() }} placeholder={searchMode === 'route' ? 'Ej: Madrid a Barcelona terrestre...' : searchMode === 'expert' ? 'Consulta experto...' : 'Cualquier consulta...'} sx={{ minWidth: 280 }} />
                      <Button variant="contained" onClick={() => handleSearch()} disabled={isLoading || !query.trim()}>{isLoading ? '...' : searchMode === 'route' ? 'Cotizar' : 'Consultar'}</Button>
                    </Box>
                  </Box>
                </Card>
              )}
              {renderToolContent()}
            </MotionBox>
          )}
        </AnimatePresence>
      </Container>
      <VoiceWidget />

      <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', py: 3, mt: 'auto' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AnchorIcon sx={{ fontSize: 18, color: 'text.disabled' }} /><Typography variant="caption" sx={{ color: 'text.disabled' }}>LogiSearch AI v2 © 2026</Typography></Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><WifiIcon sx={{ fontSize: 14, color: 'primary.main' }} /><Typography variant="caption" sx={{ color: 'text.disabled' }}>Gemini 2.0 + Tavily + Local Storage</Typography></Box>
          </Box>
        </Container>
      </Box>

      <SearchHistory open={showHistory} onClose={() => setShowHistory(false)} onSelectSearch={q => { setQuery(q) }} />
      <RfqDialog open={showRFQ} onClose={() => setShowRFQ(false)} content={searchResults?.rfq || ''} onSave={handleSaveRFQ} canSave={!!lastSearchId} origin={p?.origin} destination={p?.destination} mode={p?.mode} />
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}><Alert severity="error" onClose={() => setError(null)} variant="filled">{error}</Alert></Snackbar>
      <Snackbar open={!!successMsg} autoHideDuration={4000} onClose={() => setSuccessMsg(null)}><Alert severity="success" onClose={() => setSuccessMsg(null)} variant="filled">{successMsg}</Alert></Snackbar>
    </Box>
  )
}
export default App
