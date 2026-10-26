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
  const handleClick = (e: React.MouseEvent) => {
    if (onSelect) {
      onSelect(project);
    }
  };

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      onClick={handleClick}
      className={`group relative rounded-2xl bg-gradient-to-b from-slate-900/80 to-[#0A1220]/90 border transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected
          ? 'border-cyan-400 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-400/50'
          : 'border-slate-800/80 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/20'
      } ${compact ? 'p-4' : 'p-5 flex flex-col justify-between min-h-[175px]'}`}
    >
      {/* Subtle hover gradient wash */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Top Row: Icon + Arrow */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        {/* Project Icon Box */}
        <div
          className={`rounded-xl flex items-center justify-center shrink-0 shadow-md ${
            compact ? 'w-10 h-10' : 'w-12 h-12'
          }`}
          style={{ background: project.iconBg }}
          dangerouslySetInnerHTML={{ __html: project.iconSvg }}
        />

        {/* Diagonal Arrow Indicator */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-cyan-300 group-hover:bg-slate-800/60 transition-all">
          <ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      {/* Text Info */}
      <div className="relative z-10 mt-3">
        <h4 className="font-bold text-white text-[0.95rem] tracking-tight group-hover:text-cyan-200 transition-colors">
          {project.name}
        </h4>
        {project.subtitle && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-1 font-medium">
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
              project.status === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
            }`}
          />
          {project.status === 'live' ? 'En producción' : 'En desarrollo'}
        </span>
      </div>
    </motion.div>
  );

  return cardContent;
}
