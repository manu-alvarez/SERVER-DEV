import { motion } from 'framer-motion';
import { TECHNOLOGIES } from '../data/projects';

export default function Technologies() {
  return (
    <section id="tecnologias" className="relative py-24 lg:py-32 section-glow">
      <div className="orb w-[400px] h-[400px] bg-cyan-700 top-0 left-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Tech Grid */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
                Tecnologías
              </h2>
              <p className="text-text-secondary">
                Herramientas y tecnologías que utilizo y con las que trabajo.
              </p>
            </motion.div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {TECHNOLOGIES.map((tech, i) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="tech-logo"
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center [&>svg]:w-8 [&>svg]:h-8"
                    dangerouslySetInnerHTML={{ __html: tech.svg }}
                  />
                  <span>{tech.name}</span>
                </motion.div>
              ))}
            </div>

            {/* Quote */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex gap-3 items-center"
            >
              <div className="w-8 h-[2px] bg-gradient-to-r from-blue-500 to-transparent" />
              <p className="text-text-muted italic text-sm">
                "La tecnología cambia, la curiosidad me mantiene."
              </p>
            </motion.div>
          </div>

          {/* Right: Contact CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 space-y-6"
          >
            <h3 className="text-2xl font-bold text-white">Hablemos</h3>
            <p className="text-text-secondary">
              ¿Tienes un proyecto en mente o quieres saber más sobre mi trabajo?
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  MA
                </div>
                <div>
                  <p className="text-white font-semibold">Manuel Álvarez</p>
                  <p className="text-text-muted text-sm">Técnico de Sistemas & Developer</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                <a href="mailto:manuel@manuelalvarez.dev" className="flex items-center gap-3 text-sm group">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </span>
                  <div>
                    <span className="text-text-muted block text-xs">Email</span>
                    <span className="text-white group-hover:text-blue-400 transition-colors">manuel@manuelalvarez.dev</span>
                  </div>
                </a>
                <a href="https://linkedin.com/in/manu-alvarez-dev" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm group">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </span>
                  <div>
                    <span className="text-text-muted block text-xs">LinkedIn</span>
                    <span className="text-white group-hover:text-blue-400 transition-colors">/in/manu-alvarez-dev</span>
                  </div>
                </a>
                <a href="https://github.com/manu-alvarez" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm group">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  </span>
                  <div>
                    <span className="text-text-muted block text-xs">GitHub</span>
                    <span className="text-white group-hover:text-blue-400 transition-colors">github.com/manu-alvarez</span>
                  </div>
                </a>
              </div>
            </div>

            <a href="#contacto" className="btn-primary w-full justify-center mt-4 !py-3.5">
              Enviar mensaje
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
