import { motion } from 'framer-motion';
import { ArrowDown, Download, ChevronRight } from 'lucide-react';

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
    >
      {/* Ambient orbs */}
      <div className="orb w-[600px] h-[600px] bg-blue-600 top-1/4 -left-40" />
      <div className="orb w-[500px] h-[500px] bg-purple-700 bottom-1/4 right-0 opacity-10" />
      <div className="orb w-[300px] h-[300px] bg-cyan-500 top-1/3 right-1/4 opacity-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="relative z-10 space-y-8">
            {/* Availability badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="badge badge-green !text-[0.75rem] !px-4 !py-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Disponible para proyectos
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
                <span className="text-white block">Manuel</span>
                <span className="gradient-text block">Álvarez</span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg sm:text-xl font-semibold text-blue-400"
            >
              Técnico de Sistemas · Desarrollador Web & Apps · IA
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-text-secondary max-w-lg leading-relaxed"
            >
              Creo soluciones digitales que conectan tecnología, inteligencia artificial y personas.
              Desde la infraestructura hasta la experiencia de usuario, siempre en evolución.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <a href="#proyectos" className="btn-primary">
                Ver proyectos
                <ChevronRight size={18} />
              </a>
              <a
                href="/app/cv/CV-Manuel_Alvarez_Dianez.pdf"
                download
                className="btn-secondary"
              >
                <Download size={18} />
                Descargar CV
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex gap-10 pt-6 border-t border-white/10"
            >
              <div>
                <div className="text-3xl font-black gradient-text">7+</div>
                <div className="text-xs text-text-muted mt-1 font-medium">Proyectos principales</div>
              </div>
              <div>
                <div className="text-3xl font-black gradient-text">5+</div>
                <div className="text-xs text-text-muted mt-1 font-medium">Años de experiencia</div>
              </div>
              <div>
                <div className="text-3xl font-black gradient-text">∞</div>
                <div className="text-xs text-text-muted mt-1 font-medium">Aprendiendo siempre</div>
              </div>
            </motion.div>
          </div>

          {/* Right: Profile Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:flex items-center justify-center"
          >
            <div className="relative w-full max-w-md mx-auto">
              {/* Glow ring */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-cyan-500/20 rounded-full blur-3xl scale-110" />

              {/* Photo container */}
              <div className="relative mx-auto w-80 h-80 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl shadow-blue-500/20">
                <img
                  src="./profile-photo.png"
                  alt="Manuel Álvarez"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/40 via-transparent to-transparent" />
              </div>

              {/* Floating tech badges around photo */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-2 right-8 glass-card !p-2.5 !rounded-xl flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="-11.5 -10.232 23 20.463"><circle r="2.05" fill="white"/><g stroke="white" fill="none" strokeWidth="1"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>
                </div>
                <span className="text-xs font-bold text-white pr-1">React</span>
              </motion.div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute top-16 -left-4 glass-card !p-2.5 !rounded-xl flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                </div>
                <span className="text-xs font-bold text-white pr-1">IA</span>
              </motion.div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                className="absolute bottom-8 -right-4 glass-card !p-2.5 !rounded-xl flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M11.998 24c-.321 0-.641-.084-.922-.247l-2.936-1.737c-.438-.245-.224-.332-.08-.383.585-.203.703-.25 1.328-.604.065-.037.151-.023.218.017l2.256 1.339a.29.29 0 0 0 .272 0l8.795-5.076a.277.277 0 0 0 .134-.238V6.921a.28.28 0 0 0-.137-.242l-8.791-5.072a.278.278 0 0 0-.271 0L3.075 6.68a.28.28 0 0 0-.138.24v10.15a.27.27 0 0 0 .136.235l2.409 1.392c1.307.654 2.108-.116 2.108-.89V7.787c0-.142.114-.253.256-.253h1.115c.139 0 .255.112.255.253v10.021c0 1.745-.95 2.745-2.604 2.745-.508 0-.909 0-2.026-.551L2.28 18.675a1.857 1.857 0 0 1-.922-1.604V6.921c0-.659.353-1.275.922-1.603L11.075.242a1.925 1.925 0 0 1 1.846 0l8.794 5.076c.57.329.924.944.924 1.603v10.15a1.86 1.86 0 0 1-.924 1.604l-8.794 5.078a1.836 1.836 0 0 1-.923.247z"/></svg>
                </div>
                <span className="text-xs font-bold text-white pr-1">Node</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <a href="#proyectos" className="flex flex-col items-center gap-2 text-text-muted hover:text-white transition-colors">
          <ArrowDown size={20} className="animate-scroll-down" />
        </a>
      </motion.div>
    </section>
  );
}
