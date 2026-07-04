import React, { useState, useCallback } from 'react';
import { useExpositatorStore } from '../store/expositatorStore';
import { motion, AnimatePresence } from 'framer-motion';

export const VisionDropzone: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const addLog = useExpositatorStore((state) => state.addLog);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setCurrentImage(event.target?.result as string);
          addLog({ level: 'INFO', type: 'VIEWPORT_SYNC', message: `Diapositiva sincronizada: ${file.name}` });
        };
        reader.readAsDataURL(file);
      }
    }
  }, [addLog]);

  return (
    <div 
      className={`flex-1 relative overflow-hidden transition-colors duration-300 ${dragActive ? 'bg-brand-500/10' : 'bg-transparent'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none p-4">
        {!currentImage && (
          <div className="border-2 border-dashed border-white/20 rounded-2xl w-full h-full flex flex-col items-center justify-center p-6 bg-black/20">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-white/20 mb-3">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </motion.div>
            <p className="font-mono text-sm text-white/40 tracking-widest text-center">ARRASTRA AQUÍ<br/>LA DIAPOSITIVA ACTIVA</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {currentImage && (
          <motion.img 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            src={currentImage} 
            alt="Current Slide" 
            className="absolute inset-0 w-full h-full object-contain bg-black/90 p-4" 
          />
        )}
      </AnimatePresence>

      {dragActive && (
        <div className="absolute inset-0 border-2 border-brand-400 bg-brand-500/20 z-50 pointer-events-none" />
      )}
    </div>
  );
};
