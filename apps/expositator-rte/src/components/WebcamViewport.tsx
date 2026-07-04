import React, { useEffect, useRef } from 'react';
import { useExpositatorStore } from '../store/expositatorStore';
import { motion } from 'framer-motion';

export const WebcamViewport: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRunning = useExpositatorStore((state) => state.isRunning);
  const addLog = useExpositatorStore((state) => state.addLog);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = new MediaStream([activeStream.getVideoTracks()[0]]);
        }
        streamRef.current = activeStream;
        addLog({ level: 'INFO', type: 'HARDWARE', message: 'Camera and microphone initialized successfully.' });
      } catch (err: any) {
        addLog({ level: 'CRITICAL', type: 'HARDWARE', message: 'Hardware access denied or unavailable', details: err.message });
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    if (isRunning) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isRunning, addLog]);

  return (
    <div className="relative w-full h-1/2 bg-black overflow-hidden group border-b border-white/10">
      <video 
        ref={videoRef} 
        className={`w-full h-full object-cover transition-all duration-1000 ${isRunning ? 'opacity-100 scale-100' : 'opacity-30 scale-105 filter grayscale blur-sm'}`} 
        autoPlay 
        playsInline 
        muted 
      />
      {!isRunning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-3 bg-black/60 px-6 py-3 rounded-full backdrop-blur-md border border-white/10">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="font-mono text-sm tracking-widest text-white/50">OFFLINE</span>
          </div>
        </div>
      )}
      {isRunning && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10"
        >
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
          <span className="font-mono text-[10px] tracking-widest text-red-100 font-bold">REC</span>
        </motion.div>
      )}
    </div>
  );
};
