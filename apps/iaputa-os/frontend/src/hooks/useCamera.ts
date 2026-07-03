import { useState, useRef, useEffect, useCallback } from 'react';

export function useCamera() {
  const [visionModeActive, setVisionModeActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startVisionMode = useCallback(async (onError: (msg: string) => void) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setVisionModeActive(true);
    } catch (err) {
      if (err.name === 'OverconstrainedError' || err.name === 'NotFoundError') {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(fallbackStream);
          setVisionModeActive(true);
          return;
        } catch (fallbackErr) {
          err = fallbackErr;
        }
      }
      
      let errorMsg = String(err);
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Permiso denegado. Por favor, habilita el acceso a la cámara en la configuración de tu navegador.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No se encontró ninguna cámara conectada al dispositivo.';
      }
      onError(`❌ Error al acceder a la cámara: ${errorMsg}`);
    }
  }, []);

  const stopVisionMode = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setVisionModeActive(false);
  }, [stream]);

  useEffect(() => {
    if (visionModeActive && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [visionModeActive, stream]);

  return { visionModeActive, videoRef, startVisionMode, stopVisionMode };
}
