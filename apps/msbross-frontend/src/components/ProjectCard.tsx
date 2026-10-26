import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { Project } from '../data/projects';

interface ProjectCardProps {
  project: Project;
  index: number;
  compact?: boolean;
  onSelect?: (project: Project) => void;
  isSelected?: boolean;
}

export default function ProjectCard({
  project,
  index,
  compact = false,
  onSelect,
  isSelected = false,
}: ProjectCardProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, active: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setRotate({ x: rotateX, y: rotateY });
    setSpotlight({ x, y, active: true });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setSpotlight((prev) => ({ ...prev, active: false }));
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(project);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.04 }}
      style={{
        perspective: 1000,
      }}
      className="relative"
    >
      <div
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: 'transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)',
        }}
        className={`group relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#080E1C]/95 border transition-all duration-300 cursor-pointer overflow-hidden ${
          isSelected
            ? 'border-cyan-400 shadow-2xl shadow-cyan-950/60 ring-1 ring-cyan-400/50'
            : 'border-slate-800/80 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-950/30'
        } ${compact ? 'p-4' : 'p-5 flex flex-col justify-between min-h-[185px]'}`}
      >
        {/* Spotlight Cursor Follower Effect */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: spotlight.active ? 1 : 0,
            background: `radial-gradient(280px circle at ${spotlight.x}px ${spotlight.y}px, rgba(6, 182, 212, 0.14), transparent 80%)`,
          }}
        />

        {/* Subtle Ambient Border Glow for Selected Card */}
        {isSelected && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none" />
        )}

        {/* Top Row: Icon + Arrow */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          {/* Project Icon Box */}
          <div
            className={`rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-105 ${
              compact ? 'w-10 h-10' : 'w-12 h-12'
            }`}
            style={{ background: project.iconBg }}
            dangerouslySetInnerHTML={{ __html: project.iconSvg }}
          />

          {/* Diagonal Arrow Indicator */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-cyan-300 group-hover:bg-slate-800/70 transition-all">
            <ArrowUpRight
              size={17}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>
        </div>

        {/* Text Info */}
        <div className="relative z-10 mt-3.5">
          <h4 className="font-bold text-white text-[0.98rem] tracking-tight group-hover:text-cyan-200 transition-colors">
            {project.name}
          </h4>
          {project.subtitle && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-1 font-medium group-hover:text-slate-300 transition-colors">
              {project.subtitle}
            </p>
          )}
        </div>

        {/* Bottom Status Badge */}
        <div className="relative z-10 mt-3 pt-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
              project.status === 'live'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                project.status === 'live'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
                  : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
              }`}
            />
            {project.status === 'live' ? 'En producción' : 'En desarrollo'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
