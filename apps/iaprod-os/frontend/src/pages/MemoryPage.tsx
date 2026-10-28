import { Box, Typography, Button, Paper, Chip, Grid, List, ListItem, ListItemText, ListItemIcon, CircularProgress } from '@mui/material'
import { Memory as MemoryIcon, History as HistoryIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons/material'
import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function MemoryPage() {
  const [history, setHistory] = useState<Array<{ role: string; content: string; timestamp: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/clear-memory').then(() => setLoading(false)).catch(() => setLoading(false))
  }, [])

  const handleClear = async () => {
    try {
      await api.post('/api/clear-memory')
      setHistory([])
    } catch (e) {
      alert('Error limpiando memoria')
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Memoria Cognitiva</Typography>
        <Typography sx={{ color: '#94a3b8' }}>Historial de conversaciones y contexto retenido por IA Prod OS.</Typography>
      </Box>

      <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(10, 15, 26, 0.7)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Conversaciones Recientes</Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={handleClear}
            startIcon={<DeleteIcon sx({ fontSize: 20 }) as any />}
            sx={{ borderRadius: '10px', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e' }}
          >
            Limpiar Memoria
          </Button>
        </Box>

        {loading ? <CircularProgress size={24} /> : (
          <List>
            {history.length === 0 ? (
              <ListItem sx={{ color: '#64748b', textAlign: 'center', py: 4 }}>
                Sin historial de memoria todavía.
              </ListItem>
            ) : (
              history.map((item) => (
                <ListItem key={item.timestamp} sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <ListItemIcon sx={{ color: '#22d3ee' }}><MemoryIcon fontSize="small" /></ListItemIcon>
                  <ListItemText
                    primary={item.content.slice(0, 100)}{item.content.length > 100 ? '...' : ''}
                    secondary={item.timestamp}
                    primaryTypographyProps={{ fontWeight: 600, color: '#f8fafc' }}
                    secondaryTypographyProps={{ color: '#94a3b8', fontSize: '0.75rem' }}
                  />
                </ListItem>
              ))
            )}
          </List>
        )}
      </Paper>
    </Box>
  )
}
