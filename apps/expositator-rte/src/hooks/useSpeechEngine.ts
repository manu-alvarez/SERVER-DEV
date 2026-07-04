import { useRef, useCallback, useState } from 'react';
import { useExpositatorStore } from '../store/expositatorStore';

interface SpeechEngineOptions {
  onPartial: (text: string) => void;
  onUtterance: (data: { text: string; confidence: number; timestamp: number }) => void;
  onSilence: (durationMs: number) => void;
  onError: (error: string) => void;
}

export const useSpeechEngine = () => {
  const recognitionRef = useRef<any>(null);
  const silenceIntervalRef = useRef<number | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const silenceReportedRef = useRef<boolean>(false);
  const [transcript, setTranscript] = useState('');
  
  const handlePartial = useCallback((text: string) => {
    setTranscript(text);
  }, []);

  const initSpeechEngine = useCallback((options: SpeechEngineOptions) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      options.onError('SpeechRecognition API not supported. Requires Chromium V8.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    lastSpeechTimeRef.current = Date.now();
    silenceReportedRef.current = false;

    recognition.onresult = (event: any) => {
      lastSpeechTimeRef.current = Date.now();
      silenceReportedRef.current = false;
      
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        options.onPartial(finalTranscript.trim());
        options.onUtterance({
          text: finalTranscript.trim(),
          confidence: event.results[event.results.length - 1][0].confidence,
          timestamp: Date.now()
        });
      } else if (interimTranscript) {
        options.onPartial(interimTranscript.trim());
      }
    };

    recognition.onerror = (e: any) => options.onError(e.error);
    
    recognition.onend = () => {
      if (useExpositatorStore.getState().isRunning) {
        try { recognition.start(); } catch(e) {}
      }
    };

    recognition.start();
    recognitionRef.current = recognition;

    silenceIntervalRef.current = setInterval(() => {
      if (!useExpositatorStore.getState().isRunning) return;
      const silenceDuration = Date.now() - lastSpeechTimeRef.current;
      if (silenceDuration >= 3000 && !silenceReportedRef.current) {
        options.onSilence(silenceDuration);
        silenceReportedRef.current = true;
      }
    }, 100);
  }, []);

  const stopSpeechEngine = useCallback(() => {
    if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent restart
      recognitionRef.current.stop();
    }
  }, []);

  return { initSpeechEngine, stopSpeechEngine, transcript, handlePartial };
};
