import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useConfig } from '../hooks/useConfig';
import { useStats } from '../hooks/useStats';
import { vibrate } from '../utils/vibration';
import { playClick, playSuccess } from '../utils/sound';

const shapes = [
  { type: 'circle', label: 'Círculo' },
  { type: 'square', label: 'Cuadrado' },
  { type: 'triangle', label: 'Triángulo' },
];
const colors = ['#E74C3C', '#F1C40F', '#3498DB', '#2ECC71'];

export default function ModeFormasColores({ onExit }) {
  const [config] = useConfig();
  const [, incrementStats] = useStats();
  const [targetShape, setTargetShape] = useState(shapes[0]);
  const [targetColor, setTargetColor] = useState(colors[0]);
  const [message, setMessage] = useState('');

  const resetRound = () => {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    setTargetShape(shape);
    setTargetColor(color);
    setMessage('');
  };

  const handleShapePress = (shapeType) => {
    if (shapeType === targetShape.type) {
      setMessage('¡Correcto!');
      playSuccess();
      if (config.vibration) {
        vibrate(50);
      }
      incrementStats('formas');
      // Change to a new round after a short delay
      setTimeout(resetRound, 1500);
    } else {
      setMessage('Inténtalo de nuevo');
      playClick();
      if (config.vibration) {
        vibrate(30);
      }
    }
  };

  // Initialize first round
  React.useEffect(() => {
    resetRound();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 min-h-screen p-6">
      <div className="mb-6 text-2xl font-bold">
        Formas y Colores
      </div>
      <div className="mb-4 text-lg text-gray-600">
        Toca la forma que corresponde al color mostrado
      </div>
      {/* Color display */}
      <div className="w-32 h-32 mb-6 rounded-lg" style={{ backgroundColor: targetColor }}></div>
      {/* Shapes grid */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-md">
        {shapes.map((shape, idx) => (
          <motion.div
            key={idx}
            className="aspect-square flex items-center justify-center bg-white rounded-lg shadow-lg hover:scale-105 transition-transform"
            onClick={() => handleShapePress(shape.type)}
            whileTap={{ scale: 0.95 }}
          >
            {shape.type === 'circle' && (
              <svg width="40" height="40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="currentColor" stroke="#333" strokeWidth="4" />
              </svg>
            )}
            {shape.type === 'square' && (
              <svg width="40" height="40" viewBox="0 0 100 100">
                <rect x="10" y="10" width="80" height="80" fill="currentColor" stroke="#333" strokeWidth="4" rx="8" />
              </svg>
            )}
            {shape.type === 'triangle' && (
              <svg width="40" height="40" viewBox="0 0 100 100">
                <polygon points="50,10 90,90 10,90" fill="currentColor" stroke="#333" strokeWidth="4" />
              </svg>
            )}
          </motion.div>
        ))}
      </div>
      {message && (
        <div className="mt-4 text-lg font-medium" style={{ color: message === '¡Correcto!' ? '#2ECC71' : '#E74C3C' }}>
          {message}
        </div>
      )}
      <div className="mt-8">
        <button
          onClick={onExit}
          className="px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}