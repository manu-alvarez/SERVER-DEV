import React, { useState, useRef, useCallback } from 'react';
import { Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { useConfig } from '../hooks/useConfig';
import { vibrate } from '../utils/vibration';
import { playClick } from '../utils/sound';

export default function ParentalLockButton({ onExit }) {
  const [tapCount, setTapCount] = useState(0);
  const [holdTimer, setHoldTimer] = useState(null);
  const [doubleTapTimeout, setDoubleTapTimeout] = useState(null);
  const { vibration } = useConfig();

  const handleTouchStart = useCallback(() => {
    // Increment tap count
    setTapCount(prev => prev + 1);
    playClick();
    if (vibration) {
      vibrate(20);
    }

    // If this is the second tap within double tap window, start hold timer
    if (tapCount === 1) {
      // First tap, set a timeout to reset tap count if second tap doesn't come soon
      const dt = setDoubleTapTimeout(() => {
        setTapCount(0);
      }, 300); // 300ms max between taps for double tap
      setDoubleTapTimeout(dt);
    } else if (tapCount >= 2) {
      // Second (or more) tap detected within window
      clearTimeout(doubleTapTimeout);
      setTapCount(0); // reset after processing
      // Start hold timer for exit
      const ht = setTimeout(() => {
        onExit && onExit();
        setHoldTimer(null);
      }, 2000); // 2 seconds hold to exit
      setHoldTimer(ht);
      // Optional: give feedback that hold started
      if (vibration) {
        vibrate(50);
      }
    }
  }, [tapCount, doubleTapTimeout, onExit, vibration]);

  const handleTouchEnd = useCallback(() => {
    if (holdTimer !== null) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
      // Optionally vibrate to indicate cancelled
      if (vibration) {
        vibrate(30);
      }
    }
  }, [holdTimer, vibration]);

  return (
    <motion.button
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      // Also support mouse for testing on desktop
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full bg-foreground/80 flex items-center justify-center backdrop-blur-sm"
      aria-label="Bloqueo parental"
    >
      <Home className="w-5 h-5 text-white" />
    </motion.button>
  );
}