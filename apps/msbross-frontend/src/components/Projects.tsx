import { useState } from 'react';
import { motion } from 'framer-motion';
import { FEATURED_PROJECTS, OTHER_PROJECTS, CATEGORIES } from '../data/projects';
import type { Project } from '../data/projects';
import ProjectCard from './ProjectCard';
import ProjectModal from './ProjectModal';

export default function Projects() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredFeatured =
    activeCategory === 'all'
      ? FEATURED_PROJECTS
      : FEATURED_PROJECTS.filter((p) => p.category === activeCategory);

  const filteredOther =
    activeCategory === 'all'
      ? OTHER_PROJECTS
      : OTHER_PROJECTS.filter((p) => p.category === activeCategory);

  return (
    <section id="proyectos" className="relative py-24 lg:py-32 bg-[#060B18] overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-20 right-10 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-cyan-600/12 rounded-full blur-[130px] pointer-events-none" />

      {/* Background tech grid */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mb-12"
        >
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-2 h-0.5 bg-cyan-400" />
            Mis Proyectos
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
            Ideas que se convierten en{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              soluciones reales
            </span>
          </h2>
          <p className="text-slate-400 mt-4 text-base sm:text-lg leading-relaxed">
            Explora mis proyectos principales y herramientas en producción. Haz clic en cualquiera de ellos para ver su arquitectura, características y enlace en directo.
          </p>
        </motion.div>

        {/* Category Filters (Pill Tabs) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2.5 mb-10"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-105'
                    : 'bg-[#0E1E3D]/70 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </motion.div>

        {/* Featured Projects Grid (7 Star Projects) */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredFeatured.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
              onSelect={setSelectedProject}
            />
          ))}
        </div>

        {/* Otros Proyectos Destacados (CombiPro, Cuentos Mágicos, GasStation, Tarot RWS, Suite Beca Laud) */}
        {filteredOther.length > 0 && (
          <div className="mt-20 pt-14 border-t border-slate-800/80">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mb-8"
            >
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Otros proyectos destacados
              </h3>
              <p className="text-slate-400 mt-2 text-sm sm:text-base">
                Herramientas complementarias, aplicaciones temáticas y suites completas desarrolladas para producción.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredOther.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={i}
                  compact
                  onSelect={setSelectedProject}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Project Detail Modal */}
      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
}
