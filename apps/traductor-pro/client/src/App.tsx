import { useState, useEffect } from 'react';
import { Container, Box, Typography, Tabs, Tab, Chip, Drawer, List, ListItemButton, ListItemText, IconButton, Badge, Avatar, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import TranslateIcon from '@mui/icons-material/Translate';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ConstructionIcon from '@mui/icons-material/Construction';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import TraducirTab from './components/TraducirTab';
import ResumirTab from './components/ResumirTab';
import ExtrasTab from './components/ExtrasTab';
import { Provider, PROVIDERS, HistoryEntry } from './api';

export default function App() {
  const [tab, setTab] = useState(0);
  const [provider, setProvider] = useState<Provider>('groq');
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('arantxa_history') || '[]'); } catch { return []; }
  });
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('arantxa_history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (input: string, output: string, type: string) => {
    if (!output) return;
    setHistory(prev => [{
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: type as any,
      input: input.slice(0, 200),
      output: output.slice(0, 300),
      provider,
    }, ...prev].slice(0, 100));
  };

  const clearHistory = () => setHistory([]);

  const tabs = [
    { id: 0, icon: <TranslateIcon />, label: 'Traducir' },
    { id: 1, icon: <AutoAwesomeIcon />, label: 'Resumir' },
    { id: 2, icon: <ConstructionIcon />, label: 'Extras' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', bgcolor: '#050508' }}>
      {/* Neon Background Gradients */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(circle at 15% 15%, rgba(16, 185, 129, 0.3) 0%, transparent 45%), radial-gradient(circle at 85% 85%, rgba(110, 231, 183, 0.25) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(5, 150, 105, 0.15) 0%, transparent 60%)' }} />
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 3, md: 6 }, px: { xs: 2, md: 4 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.5rem' }, letterSpacing: 2 }}>
              Traductor <span style={{ color: '#34d399', textShadow: '0 0 20px rgba(16,185,129,0.8), 0 0 40px rgba(16,185,129,0.4)' }}>PRO</span>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Traducción y resumen inteligente con alta disponibilidad automática
            </Typography>
          </motion.div>
        </Box>

        {/* Tab Content */}
        <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto', flex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {tab === 0 && <TraducirTab provider={provider} onResult={addToHistory} />}
              {tab === 1 && <ResumirTab provider={provider} onResult={addToHistory} />}
              {tab === 2 && <ExtrasTab provider={provider} onResult={addToHistory} />}
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* Bottom Dock */}
        <Box className="portal-card" sx={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
          <Box className="portal-card-inner" sx={{
            bgcolor: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(30px)', borderRadius: 100,
            boxShadow: '0 20px 40px rgba(0,0,0,1)' }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons={false}
              sx={{ '& .MuiTabs-indicator': { display: 'none' }, '& .MuiTab-root': { minWidth: 80, py: 1.5 } }}>
              {tabs.map(t => <Tab key={t.id} icon={t.icon} label={t.label} />)}
            </Tabs>
          </Box>
        </Box>

        {/* History FAB */}
        <IconButton onClick={() => setHistoryOpen(true)}
          sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, bgcolor: 'rgba(255,255,255,0.05)' }}>
          <Badge badgeContent={history.length} color="primary" max={99}>
            <HistoryIcon />
          </Badge>
        </IconButton>
      </Container>

      {/* History Drawer */}
      <Drawer anchor="right" open={historyOpen} onClose={() => setHistoryOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 380 }, bgcolor: '#0a0a0f', p: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Historial</Typography>
          <Box>
            <IconButton onClick={clearHistory} size="small"><DeleteSweepIcon /></IconButton>
            <IconButton onClick={() => setHistoryOpen(false)} size="small"><CloseIcon /></IconButton>
          </Box>
        </Box>
        {history.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Sin historial</Typography>
        ) : (
          <List>
            {history.map(entry => (
              <ListItemButton key={entry.id} sx={{ borderRadius: 2, mb: 0.5, flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                  <Chip size="small" label={entry.type.split(':')[0]} variant="outlined" />
                  <Chip size="small" label={entry.provider} variant="outlined" />
                </Box>
                <ListItemText
                  primary={<Typography variant="caption" noWrap color="text.secondary">{entry.input}</Typography>}
                  secondary={<Typography variant="caption" noWrap sx={{ opacity: 0.6 }}>{entry.output}</Typography>}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Drawer>
    </Box>
  );
}
