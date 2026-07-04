import React from 'react';
import { useExpositatorStore } from '../store/expositatorStore';
import { motion } from 'framer-motion';

export const MetricsPanel: React.FC = () => {
  const { wpm, fillers, deviations, score } = useExpositatorStore();

  const getScoreColor = (s: number) => {
    if (s < 5) return 'text-red-500';
    if (s < 8) return 'text-amber-400';
    return 'text-brand-400';
  };

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex justify-between items-center border-b border-white/10 pb-3">
        <h2 className="text-rose-500 font-display font-black tracking-widest text-lg">TRIBUNAL LOGS</h2>
        <div className="text-right">
          <div className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">SCORE ACTUAL</div>
          <motion.div 
            key={score}
            initial={{ scale: 1.2, color: '#fff' }}
            animate={{ scale: 1, color: '' }}
            className={`text-4xl font-display font-black tracking-tighter ${getScoreColor(score)}`}
          >
            {score.toFixed(1)}
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="text-[10px] text-muted-foreground font-bold tracking-widest mb-1">WPM</div>
          <div className="text-white font-black text-xl font-display">{wpm}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="text-[10px] text-muted-foreground font-bold tracking-widest mb-1">MULETILLAS</div>
          <motion.div key={fillers} animate={{ scale: [1, 1.2, 1] }} className="text-amber-400 font-black text-xl font-display">{fillers}</motion.div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="text-[10px] text-muted-foreground font-bold tracking-widest mb-1">DESVÍOS</div>
          <motion.div key={deviations} animate={{ scale: [1, 1.2, 1] }} className="text-rose-400 font-black text-xl font-display">{deviations}</motion.div>
        </div>
      </div>
    </div>
  );
};
