import { useConnectionState, useVoiceAssistant, BarVisualizer } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { motion } from 'framer-motion';

export function NeuralOrb() {
  const roomState = useConnectionState();
  const { state: voiceState, audioTrack } = useVoiceAssistant();
  
  const getOrbState = () => {
    switch (roomState) {
      case ConnectionState.Connected:
        return {
          color: '#06ff8f',
          shadow: 'rgba(6,255,143,0.4)',
          emoji: '🗣️',
          pulseConfig: { scale: [1, 1.05, 1], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const } }
        };
      case ConnectionState.Connecting:
        return {
          color: '#00f5ff',
          shadow: 'rgba(0,245,255,0.4)',
          emoji: '⏳',
          pulseConfig: { scale: [1, 1.1, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'], transition: { duration: 1, repeat: Infinity } }
        };
      default:
        return {
          color: '#06b6d4',
          shadow: 'rgba(6,182,212,0.4)',
          emoji: '🎙️',
          pulseConfig: { scale: 1, transition: { duration: 0.5 } }
        };
    }
  };

  const state = getOrbState();

  return (
    <motion.div 
      className="relative w-48 h-48 mx-auto my-8 rounded-full flex items-center justify-center shadow-2xl overflow-hidden"
      animate={state.pulseConfig}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${state.color}, transparent)`,
        boxShadow: `0 0 60px ${state.shadow}`,
      }}
    >
      <div className="absolute inset-0 rounded-full border border-white/10 blur-[1px]"></div>
      
      {roomState === ConnectionState.Connected ? (
        <BarVisualizer
          state={voiceState}
          barCount={5}
          trackRef={audioTrack}
          className="absolute z-10 w-32 h-16"
          options={{ minHeight: 10 }}
        />
      ) : (
        <span className="relative z-10 text-6xl drop-shadow-md">{state.emoji}</span>
      )}
    </motion.div>
  );
}
