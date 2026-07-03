import { memo } from 'react';

/**
 * AmbientGlow renders the animated background glows.
 * Memoized to prevent re-renders when parent state changes.
 */
export const AmbientGlow = memo(() => {
  return (
    <>
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
    </>
  );
});

AmbientGlow.displayName = 'AmbientGlow';
