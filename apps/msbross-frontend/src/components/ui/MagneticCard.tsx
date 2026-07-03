import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import type { ReactNode } from 'react';

interface MagneticCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}

export const MagneticCard = ({ 
  children, 
  className = '', 
  glowColor = 'rgba(6,182,212,0.15)', // Default cyan glow
  onClick 
}: MagneticCardProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10 ${className}`}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              ${glowColor},
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
};
