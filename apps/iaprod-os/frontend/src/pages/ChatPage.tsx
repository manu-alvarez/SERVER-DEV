import { Box, Typography, Button, Paper, Chip, Grid, TextField, CircularProgress } from '@mui/material'
import { Mic as MicIcon, Send as SendIcon, PlayCircle as PlayIcon } from '@mui/icons/material'
import { useState } from 'react'
import { api } from '../lib/api'
import { useVoiceStore } from '../store/voice'

export default function ChatPage() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; audio?: string }>>([])
  const [loading, setLoading] = useState(false)
  const { isListening, isSpeaking, setListening, setSpeaking, setTranscript } = useVoiceStore()

  const handleSend = async () => {
    if (!message.trim()) return
    const userMsg = message
    setMessage('')
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const res = await api.post('/api/text-command', { text: userMsg })
      setMessages((prev) => [...prev, { role: 'assistant', text: res.response || 'Sin respuesta', audio: res.audio_url }])
      setSpeaking(true)
      setTimeout(() => setSpeaking(false), 3000)
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Error: ' + (e as Error).message }])
    } finally {
      setLoading(false)
    }
  }

  const handleVoice = async () => {
    setListening(!isListening)
    if (!isListening) {
      try {
        const res = await api.postForm('/api/voice-command', new FormData())
        setMessages((prev) => [...prev, { role: 'assistant', text: res.response || 'Comando de voz procesado', audio: res.audio_url }])
        setSpeaking(true)
        setTimeout(() => setSpeaking(false), 3000)
      } catch (e) {
        alert('Error en comando de voz')
      } finally {
        setListening(false)
      }
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Chat de Voz y Texto</Typography>
        <Typography sx={{ color: '#94a3b8' }}>Habla o escribe. IA Prod OS ejecuta acciones por ti.</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(10, 15, 26, 0.7)', border: '1px solid rgba(255,255,255,0.04)', height: '60vh', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {messages.map((m, i) => (
              <Box key={i} sx={{ mb: 2, display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: 2 }}>
                <Box sx={{ p: 2, borderRadius: '10px', background: m.role === 'user' ? 'rgba(34,211,238,0.15)' : 'rgba(167,139,250,0.15)', border: `1px solid ${m.role === 'user' ? 'rgba(34,211,238,0.3)' : 'rgba(167,139,250,0.3)'}` }}>
                  <Typography sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{m.text}</Typography>
                </Box>
              </Box>
            ))}
            {loading && <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#94a3b8' }}>
              <CircularProgress size={20} />
              <Typography sx={{ fontSize: '0.85rem' }}>Procesando...</Typography>
            </Box>}
          </Paper>
        </Grid>

        <Grid xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: '14px', background: 'rgba(10, 15, 26, 0.7)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Entrada</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe una orden..."
                sx={{ borderRadius: '10px' }}
              />
              <Button
                variant="contained"
                onClick={handleSend}
                disabled={loading || !message.trim()}
                startIcon={<SendIcon />}
                sx={{ background: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)', color: '#02040a', fontWeight: 800, borderRadius: '10px', px: 3 }}
              >
                Enviar
              </Button>
            </Box>
            <Button
              fullWidth
              variant="contained"
              onClick={handleVoice}
              disabled={loading}
              startIcon={<MicIcon sx({ fontSize: 24 }) as any />}
              sx={{
                background: isListening ? 'linear-gradient(135deg, #f43f5e 0%, #a78bfa 100%)' : 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
                color: '#02040a',
                fontWeight: 800,
                borderRadius: '10px',
                py: 1.5,
                '&:hover': { opacity: 0.9 },
              }}
            >
              {isListening ? 'Escuchando...' : '🎙️ Comando de Voz'}
            </Button>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Chip label={isSpeaking ? 'Hablando' : 'Inactivo'} size="small" sx={{ color: isSpeaking ? '#4ade80' : '#94a3b8' }} />
              <Chip label={isListening ? 'Micrófono ON' : 'Micrófono OFF'} size="small" sx={{ color: isListening ? '#f43f5e' : '#94a3b8' }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
