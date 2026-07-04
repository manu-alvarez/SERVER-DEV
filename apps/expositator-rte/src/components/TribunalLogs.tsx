import React, { memo, useRef, useEffect } from 'react';
import { useExpositatorStore } from '../store/expositatorStore';
import { motion, AnimatePresence } from 'framer-motion';

export const TribunalLogs: React.FC = memo(() => {
  const logs = useExpositatorStore((state) => state.logs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar flex flex-col"
    >
      <AnimatePresence initial={false}>
        {logs.map((log) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            className={`p-3 rounded-lg border font-mono text-[11px] whitespace-pre-wrap flex flex-col gap-1 shadow-md ${
              log.level === 'CRITICAL' || log.level === 'WARNING' 
                ? 'bg-red-950/40 border-red-900/50 text-red-300' 
                : 'bg-white/5 border-white/10 text-slate-300'
            }`}
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-1 mb-1">
              <span className={`font-bold tracking-widest ${log.level === 'CRITICAL' ? 'text-red-500' : log.level === 'WARNING' ? 'text-amber-500' : 'text-brand-400'}`}>
                [{log.level}] {log.type}
              </span>
              <span className="text-[9px] opacity-50">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <span>{log.message}</span>
            {log.details && (
              <pre className="mt-1 p-2 bg-black/40 rounded text-[10px] overflow-x-auto text-white/70">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      {logs.length === 0 && (
        <div className="h-full flex items-center justify-center text-white/30 font-mono text-sm text-center p-4 border border-dashed border-white/10 rounded-xl">
          El Tribunal está a la espera...<br/>Inicie sesión para comenzar evaluación.
        </div>
      )}
    </div>
  );
});
