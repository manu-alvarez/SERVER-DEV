import { memo } from 'react';

const AmbientGlow = memo(() => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>
    </div>
  );
});

AmbientGlow.displayName = 'AmbientGlow';

export default AmbientGlow;
