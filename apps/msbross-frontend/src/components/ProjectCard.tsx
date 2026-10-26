import { motion } from 'framer-motion';
import type { Project } from '../data/projects';

interface ProjectCardProps {
  project: Project;
  index: number;
  compact?: boolean;
}

export default function ProjectCard({ project, index, compact = false }: ProjectCardProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={`glass-card group cursor-pointer ${compact ? 'p-4' : 'p-5'}`}
    >
      <div className={`flex ${compact ? 'items-center gap-3' : 'flex-col gap-4'}`}>
        {/* Icon */}
        <div
          className={`project-icon shrink-0 ${compact ? '' : 'w-12 h-12'}`}
          style={{ background: project.iconBg }}
          dangerouslySetInnerHTML={{ __html: project.iconSvg }}
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className={`font-bold text-white leading-tight ${compact ? 'text-sm' : 'text-[0.95rem]'}`}>
            {project.name}
          </h3>
          {project.subtitle && (
            <p className={`text-text-secondary mt-0.5 ${compact ? 'text-xs' : 'text-xs'}`}>
              {project.subtitle}
            </p>
          )}

          {/* Status badge */}
          <div className="mt-3">
            <span className="badge badge-green">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {project.status === 'live' ? 'En producción' : 'En desarrollo'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (project.url) {
    return (
      <a href={project.url} target="_blank" rel="noreferrer" className="block">
        {content}
      </a>
    );
  }

  return content;
}
