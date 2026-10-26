import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import type { Project } from '../data/projects';

interface ProjectCardProps {
  project: Project;
  index: number;
  compact?: boolean;
}

export default function ProjectCard({
  project,
  index,
  compact = false,
}: ProjectCardProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, active: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    setRotate({ x: rotateX, y: rotateY });
    setSpotlight({ x, y, active: true });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setSpotlight((prev) => ({ ...prev, active: false }));
  };

  const handleCardClick = () => {
    if (project.url) {
      window.open(project.url, '_blank', 'noopener,noreferrer');
    } else {
      const contactEl = document.getElementById('contacto');
      if (contactEl) {
        contactEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.04 }}
      style={{ perspective: 1000 }}
      className="relative h-full"
    >
      <div
        onClick={handleCardClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: 'transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)',
        }}
        className={`group relative rounded-2xl bg-gradient-to-b from-[#0B1224]/95 to-[#060A16]/98 border border-slate-800/80 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-950/40 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${
          compact ? 'p-4 min-h-[160px]' : 'p-5 min-h-[220px]'
        }`}
      >
        {/* Spotlight Follower */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: spotlight.active ? 1 : 0,
            background: `radial-gradient(280px circle at ${spotlight.x}px ${spotlight.y}px, rgba(6, 182, 212, 0.14), transparent 80%)`,
          }}
        />

        {/* Top Row: Icon + External Action Arrow */}
        <div>
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-cyan-300 group-hover:bg-slate-800/80 transition-all">
              <ArrowUpRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>
          </div>

          {/* Titles & Description */}
          <div className="relative z-10 mt-3.5 space-y-1">
            <h4 className="font-bold text-white text-[1rem] tracking-tight group-hover:text-cyan-200 transition-colors">
              {project.name}
            </h4>
            {project.subtitle && (
              <p className="text-xs text-cyan-400 font-medium">
                {project.subtitle}
              </p>
            )}
            <p className="text-xs text-slate-300/90 leading-relaxed pt-1 line-clamp-3">
              {project.description}
            </p>
          </div>
        </div>

        {/* Tech Badges & Status */}
        <div className="relative z-10 mt-4 pt-3 border-t border-slate-800/80 space-y-2.5">
          {/* Real Technologies for this project */}
          <div className="flex flex-wrap gap-1.5">
            {project.tech.slice(0, 4).map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-300"
              >
                {t}
              </span>
            ))}
          </div>

          {/* Bottom Status & Demo Link */}
          <div className="flex items-center justify-between pt-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
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

            {project.url && (
              <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1 group-hover:underline">
                Ver demo <ExternalLink size={11} />
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
