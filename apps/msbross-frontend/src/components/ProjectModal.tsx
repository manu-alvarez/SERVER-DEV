import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, CheckCircle2, Layers, Cpu, ShieldCheck } from 'lucide-react';
import type { Project } from '../data/projects';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (project) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#060B18]/85 backdrop-blur-xl transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-gradient-to-b from-[#0E1E3D] via-[#09152B] to-[#060B18] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/60 overflow-hidden z-10 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Top Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-cyan-500/15 blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-slate-800/80 relative">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700/60"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>

              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-white [&>svg]:w-6 [&>svg]:h-6 [&>svg]:shrink-0"
                  style={{ background: project.iconBg }}
                  dangerouslySetInnerHTML={{ __html: project.iconSvg }}
                />

                <div className="space-y-1 pr-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {project.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        project.status === 'live'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {project.status === 'live' ? 'En producción' : 'En desarrollo'}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
                    {project.name}
                  </h3>
                  {project.subtitle && (
                    <p className="text-sm font-medium text-cyan-400">
                      {project.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Layers size={14} className="text-cyan-400" />
                  Descripción General
                </h4>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Key Features */}
              {project.features && project.features.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    Capacidades Clave
                  </h4>
                  <ul className="space-y-2">
                    {project.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Architecture & Stack */}
              {project.architecture && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Cpu size={14} className="text-indigo-400" />
                    Arquitectura & Despliegue
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl font-mono">
                    {project.architecture}
                  </p>
                </div>
              )}

              {/* Tech Stack Pills */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                  Tecnologías Utilizadas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs font-mono font-medium text-cyan-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="p-6 bg-[#040714]/80 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Abrir aplicación en vivo
                    <ExternalLink size={15} />
                  </a>
                )}
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800/80 text-slate-200 hover:text-white hover:bg-slate-700/80 font-semibold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    Ver en GitHub
                  </a>
                )}
              </div>

              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
