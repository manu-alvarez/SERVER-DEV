import React, { useState, useEffect, useCallback, useRef } from 'react';

interface EyePatchTimerProps {
  onComplete?: () => void;
}

const EyePatchTimer: React.FC<EyePatchTimerProps> = ({ onComplete }) => {
  const [activeMinutes, setActiveMinutes] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(5 * 60);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    if (totalSeconds <= 0) {
      clearTimer();
      setIsRunning(false);
      setDone(true);
      onComplete?.();
      return;
    }
    intervalRef.current = setInterval(() => {
      setTotalSeconds(s => {
        if (s <= 1) {
          clearTimer();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearTimer();
  }, [isRunning, totalSeconds, clearTimer, onComplete]);

  const displayMinutes = Math.floor(totalSeconds / 60);
  const displaySeconds = totalSeconds % 60;

  const startTimer = () => {
    if (totalSeconds > 0) {
      setDone(false);
      setIsRunning(true);
    }
  };

  const resetTimer = () => {
    clearTimer();
    setIsRunning(false);
    setDone(false);
    setTotalSeconds(minutes * 60);
  };

  if (done) {
    return (
      <div style={{ textAlign: 'center', animation: 'fadeInUp 0.5s ease' }}>
        <div style={{ fontSize: '5rem', marginBottom: '1rem', animation: 'float 3s ease-in-out infinite' }}>🎉</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--green)', marginBottom: '0.5rem' }}>¡Tiempo cumplido!</h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--text2)', marginBottom: '1rem' }}>¡Muy bien! ¡Has completado tu ejercicio!</p>
        <button onClick={resetTimer} style={{
          padding: '1rem 2rem', fontSize: '1.2rem', fontWeight: 700,
          background: 'linear-gradient(135deg, var(--green), var(--accent2))',
          border: 'none', borderRadius: '15px', color: 'white', cursor: 'pointer',
        }}>
          🔄 Jugar otra vez
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', animation: 'fadeInUp 0.5s ease' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--green)', marginBottom: '0.5rem' }}>⏱️ Tiempo del Parche</h2>
      <p style={{ fontSize: '1rem', color: 'var(--text2)', marginBottom: '1rem' }}>¡Cuenta regresiva para tu ejercicio!</p>
      <div style={{
        fontSize: '5rem', fontWeight: 900, fontFamily: 'var(--font-display)',
        color: isRunning ? 'var(--green)' : 'var(--text)',
        marginBottom: '1rem',
      }}>
        {String(displayMinutes).padStart(2, '0')}:{String(displaySeconds).padStart(2, '0')}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={startTimer} disabled={isRunning} style={{
          padding: '1rem 2rem', fontSize: '1.2rem', fontWeight: 700,
          background: isRunning ? '#333' : 'linear-gradient(135deg, var(--green), var(--blue))',
          border: 'none', borderRadius: '15px', color: 'white',
          cursor: isRunning ? 'not-allowed' : 'pointer',
        }}>
          ▶️ Empezar
        </button>
        <button onClick={resetTimer} style={{
          padding: '1rem 2rem', fontSize: '1.2rem', fontWeight: 700,
          background: 'linear-gradient(135deg, var(--red), var(--orange))',
          border: 'none', borderRadius: '15px', color: 'white', cursor: 'pointer',
        }}>
          🔄 Reiniciar
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[5, 10, 15, 20, 30].map(m => (
          <button key={m} onClick={() => { setActiveMinutes(m); setTotalSeconds(m * 60); setIsRunning(false); setDone(false); clearTimer(); }} style={{
            padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 700,
            background: activeMinutes === m && !isRunning ? 'var(--green)' : 'rgba(255,255,255,0.05)',
            border: `2px solid ${activeMinutes === m && !isRunning ? 'var(--green)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '10px',
            color: activeMinutes === m && !isRunning ? 'white' : 'var(--text)',
            cursor: 'pointer',
          }}>
            {m} min
          </button>
        ))}
      </div>
    </div>
  );
};

export default EyePatchTimer;
