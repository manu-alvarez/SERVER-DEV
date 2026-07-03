import { useEffect, useState } from 'react'
import { Box, Typography, Alert, AlertTitle, Stack, CircularProgress, Collapse, IconButton } from '@mui/material'
import { ErrorOutlined, WarningAmber, InfoOutlined, Close } from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchGlobalAlerts, type GlobalAlert } from '../services/perplexity'

export default function GlobalAlerts() {
  const [alerts, setAlerts] = useState<GlobalAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    fetchGlobalAlerts().then(data => {
      setAlerts(data)
      setLoading(false)
      // Si no hay alertas de severidad media o alta, podemos cerrarlo por defecto,
      // pero vamos a dejarlo abierto si hay datos.
      if (data.length === 0) setOpen(false)
    })
  }, [])

  if (loading) {
    return (
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
        <CircularProgress size={20} color="inherit" />
        <Typography variant="body2">Escaneando el mundo por disrupciones logísticas (Perplexity AI)...</Typography>
      </Box>
    )
  }

  if (alerts.length === 0 || !open) return null

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'high': return <ErrorOutlined fontSize="small" />
      case 'medium': return <WarningAmber fontSize="small" />
      default: return <InfoOutlined fontSize="small" />
    }
  }
  
  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      default: return 'info'
    }
  }

  return (
    <Collapse in={open}>
      <Box sx={{ mb: 3, position: 'relative' }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00E5FF', animation: 'pulse 2s infinite' }}></span>
          RADAR LOGÍSTICO GLOBAL EN TIEMPO REAL
        </Typography>
        
        <Stack spacing={1}>
          <AnimatePresence>
            {alerts.map((alert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Alert 
                  severity={getSeverityColor(alert.severity) as any} 
                  icon={getSeverityIcon(alert.severity)}
                  sx={{ 
                    backgroundColor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                  action={
                    i === 0 ? (
                      <IconButton
                        aria-label="close"
                        color="inherit"
                        size="small"
                        onClick={() => {
                          setOpen(false);
                        }}
                      >
                        <Close fontSize="inherit" />
                      </IconButton>
                    ) : null
                  }
                >
                  <AlertTitle sx={{ fontWeight: 'bold' }}>
                    {alert.title} {alert.location && `📍 ${alert.location}`}
                  </AlertTitle>
                  {alert.description}
                </Alert>
              </motion.div>
            ))}
          </AnimatePresence>
        </Stack>
      </Box>
      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
        `}
      </style>
    </Collapse>
  )
}
