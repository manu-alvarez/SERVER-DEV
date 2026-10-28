import { useEffect } from 'react'
import { useVoiceStore } from '../store/voice'

export default function VoiceStream() {
  const { isListening, setListening, setTranscript } = useVoiceStore()

  useEffect(() => {
    if (!isListening) return
    const recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!recognition) {
      setTranscript('Speech Recognition no soportado en este navegador')
      setListening(false)
      return
    }
    const rec = new recognition()
    rec.lang = 'es-ES'
    rec.interimResults = true
    rec.onresult = (e: any) => {
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript
        if (e.results[i].isFinal) final += transcript + ' '
        else setTranscript(transcript)
      }
      if (final) {
        setTranscript('')
        // Enviar comando de voz final al backend
        const formData = new FormData()
        // Aquí se enviaría el audio grabado; por ahora simulamos con texto final
        console.log('Comando de voz detectado:', final)
      }
    }
    rec.onend = () => setListening(false)
    rec.start()
    return () => rec.stop()
  }, [isListening])

  return null
}
