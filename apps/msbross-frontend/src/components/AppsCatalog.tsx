import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Download, Wrench, Code } from 'lucide-react';
import { ALL_PROJECTS, CATEGORIES, STATUS_LABELS, type Project, type ProjectStatus } from '../data/projects';
import ParticleCanvas from './ParticleCanvas';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Catálogo completo de proyectos y aplicaciones (/apps) — Misión de cierre.
 * ÚNICO listado completo de la web (la portada solo destaca proyectos y
 * enlaza aquí). Datos: exclusivamente de data/projects.ts.
 */

const STATUS_STYLE: Record<ProjectStatus, { dot: string; label: string }> = {
  live: { dot: 'bg-emerald-400', label: STATUS_LABELS.live },
  development: { dot: 'bg-amber-400', label: STATUS_LABELS.development },
  experimental: { dot: 'bg-violet-400', label: STATUS_LABELS.experimental },
};

function StatusBadge({ status }: { status: ProjectStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#0E1E3D]/70 border border-slate-700 text-slate-300">
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function CatalogCard({ project }: { project: Project }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
      className="group relative flex flex-col rounded-2xl border border-slate-800 bg-[#0A1428]/80 p-5 hover:border-cyan-600/60 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-10 h-10 rounded-xl grid place-items-center text-white shrink-0"
          style={{ background: project.iconBg }}
          aria-hidden
        >
          <span className="[&>svg]:w-5 [&>svg]:h-5" dangerouslySetInnerHTML={{ __html: project.iconSvg }} />
        </div>
        <StatusBadge status={project.status} />
      </div>

      <h3 className="mt-3 text-lg font-bold text-white leading-snug">{project.name}</h3>
      <p className="text-xs font-semibold text-cyan-400/90 uppercase tracking-wide">{project.subtitle}</p>

      <p className="mt-2 text-sm text-slate-400 leading-relaxed flex-1">{project.description}</p>

      {project.problem && (
        <p className="mt-2 text-[13px] text-slate-500 leading-relaxed border-l-2 border-slate-700 pl-3">{project.problem}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.tech.slice(0, 5).map((t) => (
          <span key={t} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-3 text-sm">
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium"
          >
            <ExternalLink size={15} /> Abrir
          </a>
        )}
        {project.download && (
          <a href={project.download} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white">
            <Download size={15} /> APK
          </a>
        )}
        {project.github && (
          <a href={project.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white ml-auto">
            <Code size={15} /> código
          </a>
        )}
        {!project.url && !project.github && !project.download && (
          <span className="ml-auto text-slate-600 text-xs inline-flex items-center gap-1">
            <Wrench size={13} /> sin enlace público
          </span>
        )}
      </div>
    </motion.article>
  );
}

export default function AppsCatalog() {
  const [active, setActive] = useState<string>('all');

  const filtered = useMemo(
    () => (active === 'all' ? ALL_PROJECTS : ALL_PROJECTS.filter((p) => p.category === active)),
    [active],
  );

  const countBy = (id: string) => (id === 'all' ? ALL_PROJECTS.length : ALL_PROJECTS.filter((p) => p.category === id).length);

  return (
    <div className="relative min-h-[100dvh] bg-[#060B18] text-[#F1F5F9]">
      <ParticleCanvas />
      <Navbar />
      <main className="relative z-10 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <a href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-4">
              <ArrowLeft size={16} /> Volver al inicio
            </a>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              Proyectos y{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                aplicaciones
              </span>
            </h1>
            <p className="mt-3 text-slate-400 text-base sm:text-lg leading-relaxed">
              Catálogo completo y centralizado: {ALL_PROJECTS.length} proyectos reales con su estado verificado —
              lo que está en producción, lo que está en desarrollo y lo que es experimento. Sin inflar el perfil.
            </p>
          </motion.div>

          {/* Filtros por categoría */}
          <div className="flex flex-wrap gap-2.5 my-8">
            {([{ id: 'all', label: 'Todos' }, ...CATEGORIES] as Array<{ id: string; label: string }>).map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  active === c.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                    : 'bg-[#0E1E3D]/70 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {c.label} ({countBy(c.id)})
              </button>
            ))}
          </div>

          {/* ÚNICO listado completo de la web */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map((p) => (
              <CatalogCard key={p.id} project={p} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
