import { useState, useCallback, useRef } from 'react';
import { ApiService } from '../services/api';

export function useSpeechRecognition(
  onStateChange: (state: 'idle' | 'listening' | 'thinking' | 'error') => void,
  onTranscript: (text: string) => void,
  onAssistantReply: (text: string) => void,
  onError: (error: string) => void
) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<any>(null);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError('❌ Web Speech API no soportada en este navegador.');
      return;
    }
    
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setRecording(true);
        onStateChange('listening');
      };
      
      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setRecording(false);
        onStateChange('thinking');
        onTranscript(`🎤 ${transcript}`);
        
        try {
          const response = await ApiService.sendTextCommand(transcript);
          onAssistantReply(response);
        } catch (err) {
          onError(`❌ Error de conexión: ${String(err)}`);
          onStateChange('error');
          setTimeout(() => onStateChange('idle'), 3000);
        }
      };
      
      recognition.onerror = () => {
        setRecording(false);
        onStateChange('error');
        setTimeout(() => onStateChange('idle'), 3000);
      };
      
      recognition.onend = () => {
        setRecording(false);
        onStateChange('idle'); 
      };

      recognition.start();
      mediaRecorderRef.current = recognition; 
    } catch (err) {
      onStateChange('error');
      setTimeout(() => onStateChange('idle'), 3000);
    }
  }, [onStateChange, onTranscript, onAssistantReply, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.stop) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, []);

  return { recording, startRecording, stopRecording };
}
