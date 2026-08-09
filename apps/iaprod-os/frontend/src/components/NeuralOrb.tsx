import { Orb } from 'orb-ui';
import type { OrbState } from 'orb-ui';

interface EnterpriseOrbProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';
  volume?: number;
}

/**
 * Enterprise-grade voice orb using orb-ui library.
 * Maps internal app states to OrbState and renders the animated circle theme.
 */
export default function EnterpriseOrb({ state = 'idle', volume = 0 }: EnterpriseOrbProps) {
  const orbState: OrbState = state === 'speaking' ? 'speaking'
    : state === 'thinking' ? 'thinking'
    : state === 'listening' ? 'listening'
    : state === 'error' ? 'error'
    : 'idle';

  return (
    <div className="enterprise-orb-wrapper" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      maxWidth: '280px',
      margin: '0 auto',
      filter: `drop-shadow(0 0 ${20 + volume * 40}px ${orbState === 'error' ? '#ef4444' : '#3b82f6'})`,
      transition: 'filter 0.3s ease',
    }}>
      <Orb
        state={orbState}
        volume={volume}
        theme="circle"
        size={220}
        aria-label="IAProd OS Voice Assistant"
      />
      <div style={{
        position: 'absolute',
        bottom: '-2rem',
        textAlign: 'center',
        fontSize: '0.65rem',
        fontFamily: 'monospace',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: orbState === 'error' ? '#ef4444'
          : orbState === 'speaking' ? '#22c55e'
          : orbState === 'listening' ? '#06b6d4'
          : orbState === 'thinking' ? '#f59e0b'
          : '#6b7280',
        opacity: 0.8,
        transition: 'color 0.3s ease',
      }}>
        {orbState === 'idle' ? 'ready' : orbState}
      </div>
    </div>
  );
}
