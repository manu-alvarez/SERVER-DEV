import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useConfig } from '../hooks/useConfig';
import { useStats } from '../hooks/useStats';
import { vibrate } from '../utils/vibration';
import { playClick, playSuccess } from '../utils/sound';

const shapes = [
  { type: 'circle', size: 120, x: '25%', y: '35%' },
  { type: 'square', size: 110, x: '70%', y: '30%' },
  { type: 'triangle', size: 130, x: '50%', y: '70%' },
  { type: 'circle', size: 90, x: '80%', y: '75%' },
];
const colors = ['#E74C3C', '#F1C40F'];

export default function AltoContraste({ onExit }) {
  const [config] = useConfig();
  const [, incrementStats] = useStats();
  const [fill, setFill] = useState('#FFFFFF');

  const handleShapeTap = useCallback((idx) => {
    const next = colors[Math.floor(Math.random() * colors.length)];
    setFill(next);
    playSuccess();
    if (config.vibration) {
      vibrate(30);
    }
    // Increment stats for this mode
    incrementStats('alto');
  }, [config.vibration]);

  return (
    <div style={{ background: '#000', width: '100%', height: '100vh' }}>
      {shapes.map((s, i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', left: s.x, top: s.y, translate: '-50% -50%', width: s.size, height: s.size }}
          onClick={() => handleShapeTap(i)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          {s.type === 'circle' && (
            <svg width={s.size} height={s.size} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill={fill} stroke="#FFFFFF" strokeWidth="8" />
            </svg>
          )}
          {s.type === 'square' && (
            <svg width={s.size} height={s.size} viewBox="0 0 100 100">
              <rect x="10" y="10" width="80" height="80" fill={fill} stroke="#FFFFFF" strokeWidth="8" rx="12" />
            </svg>
          )}
          {s.type === 'triangle' && (
            <svg width={s.size} height={s.size} viewBox="0 0 100 100">
              <polygon points="50,10 90,90 10,90" fill={fill} stroke="#FFFFFF" strokeWidth="8" />
            </svg>
          )}
        </motion.div>
      ))}
    </div>
  );
}