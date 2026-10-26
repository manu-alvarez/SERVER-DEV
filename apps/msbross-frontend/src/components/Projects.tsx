import { useState } from 'react';
import { motion } from 'framer-motion';
import { FEATURED_PROJECTS, OTHER_PROJECTS, CATEGORIES } from '../data/projects';
import ProjectCard from './ProjectCard';

export default function Projects() {
  const [activeCategory, setActiveCategory] = useState('all');

  const allFeatured = FEATURED_PROJECTS;
  const filteredFeatured =
    activeCategory === 'all'
      ? allFeatured
      : allFeatured.filter((p) => p.category === activeCategory);

  const filteredOther =
    activeCategory === 'all'
      ? OTHER_PROJECTS
      : OTHER_PROJECTS.filter((p) => p.category === activeCategory);

  return (
    <section id="proyectos" className="relative py-24 lg:py-32 section-glow">
      {/* Ambient */}
      <div className="orb w-[500px] h-[500px] bg-blue-700 -top-40 right-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mb-12"
        >
          <p className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-3">
            Mis Proyectos
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Ideas que se convierten en{' '}
            <span className="gradient-text">soluciones reales</span>
          </h2>
          <p className="text-text-secondary mt-4 text-lg">
            Explora mis proyectos organizados por áreas. Cada uno representa un paso más
            en mi evolución como desarrollador y creador de herramientas con IA.
          </p>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`filter-tab cursor-pointer ${
                activeCategory === cat.id ? 'filter-tab-active' : 'filter-tab-inactive'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Featured Projects Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredFeatured.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>

        {/* Other Projects */}
        {filteredOther.length > 0 && (
          <div className="mt-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-white mb-2">
                Otros proyectos destacados
              </h3>
              <p className="text-text-secondary mb-8">
                Herramientas que amplían mi ecosistema de desarrollo, productividad y creatividad.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredOther.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={i}
                  compact
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
