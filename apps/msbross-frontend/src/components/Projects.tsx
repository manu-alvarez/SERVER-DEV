import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FEATURED_PROJECTS, OTHER_PROJECTS, CATEGORIES } from '../data/projects';
import type { Project } from '../data/projects';
import ProjectCard from './ProjectCard';
import ProjectShowcase from './ProjectShowcase';

export default function Projects() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(FEATURED_PROJECTS[0]);

  const allFeatured = FEATURED_PROJECTS;
  const filteredFeatured =
    activeCategory === 'all'
      ? allFeatured
      : allFeatured.filter((p) => p.category === activeCategory);

  const filteredOther =
    activeCategory === 'all'
      ? OTHER_PROJECTS
      : OTHER_PROJECTS.filter((p) => p.category === activeCategory);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    // Smooth scroll down to showcase if clicked
    const el = document.getElementById('project-showcase');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <section id="proyectos" className="relative py-24 lg:py-32">
      {/* Ambient background glow */}
      <div className="absolute top-20 right-10 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none" />

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
            Explora mis proyectos organizados por áreas. Cada uno representa un paso más
            en mi evolución como desarrollador y creador de herramientas con IA.
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
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </motion.div>

        {/* Featured Projects Grid (4 Columns) */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredFeatured.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
              onSelect={handleSelectProject}
              isSelected={selectedProject?.id === project.id}
            />
          ))}
        </div>

        {/* Interactive Selected Project Showcase (Panel 2 from Mockup) */}
        <div id="project-showcase" className="mt-14">
          <AnimatePresence mode="wait">
            {selectedProject && (
              <ProjectShowcase
                key={selectedProject.id}
                selectedProject={selectedProject}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Otros Proyectos Destacados (Panel 5 from Mockup) */}
        {filteredOther.length > 0 && (
          <div className="mt-20 pt-12 border-t border-slate-800/80">
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
                Herramientas que amplían mi ecosistema de desarrollo, productividad y creatividad.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOther.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={i}
                  compact
                  onSelect={handleSelectProject}
                  isSelected={selectedProject?.id === project.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
