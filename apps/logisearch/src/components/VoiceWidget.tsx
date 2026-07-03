import { useState, useEffect, useRef } from 'react'
import { Box, Fab, Tooltip, CircularProgress, Typography, Popover, IconButton, Paper, Stack } from '@mui/material'
import { Mic, MicOff, Stop, GraphicEq, Close, RecordVoiceOver } from '@mui/icons-material'
import { sendToAI } from '../services/aiProvider'

// Declaraciones de tipos para Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceWidget() {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    // Inicializar Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'es-ES'

      recognitionRef.current.onstart = () => {
        setIsListening(true)
        setTranscript('Escuchando...')
        setAiResponse('')
      }

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex
        const text = event.results[current][0].transcript
        setTranscript(text)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    // Inicializar Speech Synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort()
      if (synthRef.current) synthRef.current.cancel()
    }
  }, [])

  // Disparar procesamiento cuando se para de escuchar y hay texto real
  useEffect(() => {
    if (!isListening && transcript && transcript !== 'Escuchando...') {
      handleProcessAudio(transcript)
    }
  }, [isListening])

  const toggleListen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    
    if (isSpeaking) {
      stopSpeaking()
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      if (synthRef.current) synthRef.current.cancel()
      try {
        recognitionRef.current?.start()
      } catch (e) {
        console.error("Speech recognition error", e)
      }
    }
  }

  const handleProcessAudio = async (text: string) => {
    setIsProcessing(true)
    setAiResponse('Pensando...')
    
    try {
      const prompt = `Actúa como un asistente logístico de MSBross (voz). Responde de forma muy concisa, natural, conversacional y directa a la siguiente consulta del usuario. Máximo 2 o 3 oraciones cortas, ya que será leído por voz.
      Consulta: "${text}"`
      
      const response = await sendToAI(prompt)
      
      // Limpiar respuesta para lectura (quitar asteriscos de negritas, emojis, etc)
      const cleanResponse = response.replace(/\*/g, '').replace(/_/g, '').trim()
      setAiResponse(cleanResponse)
      speak(cleanResponse)
    } catch (error) {
      console.error(error)
      setAiResponse("Lo siento, hubo un error de conexión.")
      setIsProcessing(false)
    }
  }

  const speak = (text: string) => {
    if (!synthRef.current) return
    setIsProcessing(false)
    setIsSpeaking(true)

    utteranceRef.current = new SpeechSynthesisUtterance(text)
    utteranceRef.current.lang = 'es-ES'
    utteranceRef.current.rate = 1.05
    utteranceRef.current.pitch = 1.0
    
    // Intentar buscar una voz más natural (Google o nativa)
    const voices = synthRef.current.getVoices()
    const preferredVoice = voices.find(v => v.lang.includes('es') && (v.name.includes('Google') || v.name.includes('Natural')))
    if (preferredVoice) utteranceRef.current.voice = preferredVoice

    utteranceRef.current.onend = () => setIsSpeaking(false)
    utteranceRef.current.onerror = () => setIsSpeaking(false)

    synthRef.current.speak(utteranceRef.current)
  }

  const stopSpeaking = () => {
    if (synthRef.current) synthRef.current.cancel()
    setIsSpeaking(false)
    setAnchorEl(null)
  }

  const handleClose = () => {
    stopSpeaking()
    if (recognitionRef.current) recognitionRef.current.abort()
    setIsListening(false)
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  // Si no hay soporte en el navegador, no renderizar
  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return null

  return (
    <>
      <Tooltip title="Agente Logístico de Voz" placement="left">
        <Fab 
          color={isListening ? "error" : isSpeaking ? "success" : "primary"}
          aria-label="voice-agent" 
          onClick={toggleListen}
          sx={{ 
            position: 'fixed', 
            bottom: 32, 
            right: 32,
            boxShadow: isListening ? '0 0 20px rgba(239, 68, 68, 0.7)' : 
                       isSpeaking ? '0 0 20px rgba(34, 197, 94, 0.7)' : 3,
            transition: 'all 0.3s ease',
            zIndex: 9999
          }}
        >
          {isProcessing ? <CircularProgress size={24} color="inherit" /> :
           isListening ? <GraphicEq sx={{ animation: 'pulse 1s infinite' }} /> : 
           isSpeaking ? <RecordVoiceOver /> : 
           <Mic />}
        </Fab>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: { 
              p: 2, 
              width: 300, 
              mb: 2,
              mr: 2,
              borderRadius: 3,
              backgroundColor: 'rgba(20, 20, 20, 0.85)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              border: '1px solid rgba(0, 229, 255, 0.2)'
            }
          }
        }}
      >
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} color="primary">
              Agente MSBross
            </Typography>
            <IconButton size="small" onClick={handleClose}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
          
          <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontStyle: transcript ? 'normal' : 'italic', color: transcript ? 'text.primary' : 'text.secondary' }}>
              {transcript || "Pulsa el micrófono para hablar..."}
            </Typography>
          </Paper>

          {aiResponse && (
            <Box sx={{ borderLeft: '3px solid', borderColor: 'primary.main', pl: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                {aiResponse}
              </Typography>
            </Box>
          )}

          {(isListening || isSpeaking) && (
            <Button 
              fullWidth 
              variant="outlined" 
              color="error" 
              size="small" 
              startIcon={isSpeaking ? <Stop /> : <MicOff />}
              onClick={isSpeaking ? stopSpeaking : () => recognitionRef.current?.stop()}
            >
              {isSpeaking ? 'Detener Voz' : 'Parar Escucha'}
            </Button>
          )}
        </Stack>
      </Popover>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </>
  )
}
import { Button } from '@mui/material'
