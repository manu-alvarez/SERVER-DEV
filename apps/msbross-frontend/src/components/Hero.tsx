import { motion } from 'framer-motion';
import { ArrowDown, Download, ArrowRight } from 'lucide-react';

const FLOATING_TAGS = [
  { label: 'IA', delay: 0, x: -140, y: -90, color: 'from-cyan-500 to-blue-500' },
  { label: 'WEB', delay: 0.8, x: -160, y: -20, color: 'from-blue-500 to-indigo-500' },
  { label: 'APPS', delay: 1.6, x: -150, y: 50, color: 'from-indigo-500 to-purple-500' },
  { label: 'SISTEMAS', delay: 2.4, x: -130, y: 120, color: 'from-cyan-400 to-teal-400' },
  { label: '</>', delay: 3.2, x: -90, y: 180, color: 'from-blue-400 to-cyan-400' },
];

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center overflow-hidden pt-20 pb-16"
    >
      {/* Cinematic ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-[650px] h-[650px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/3 right-10 w-[550px] h-[550px] bg-cyan-500/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid overlay pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column (Typography & CTAs) */}
          <div className="lg:col-span-7 space-y-7">
            {/* Availability Pill */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Disponible para proyectos
              </span>
            </motion.div>

            {/* Name Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
                <span className="text-white block">Manuel</span>
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent block">
                  Álvarez
                </span>
              </h1>
            </motion.div>

            {/* Professional Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="text-lg sm:text-xl font-medium text-slate-300"
            >
              Técnico de Sistemas | Desarrollador{' '}
              <span className="text-cyan-400 font-semibold underline decoration-cyan-500/40 decoration-2 underline-offset-4">
                Web, Apps y Herramientas con IA
              </span>
            </motion.p>

            {/* Bio description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed"
            >
              Creo soluciones digitales que conectan tecnología, inteligencia artificial y personas.
              Desde la infraestructura hasta la experiencia de usuario, siempre en evolución.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <a
                href="#proyectos"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                Ver proyectos
                <ArrowRight size={17} />
              </a>
              <a
                href="/app/cv/CV-Manuel_Alvarez_Dianez.pdf"
                download
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-slate-900/60 backdrop-blur-md text-slate-200 font-semibold text-sm border border-slate-700/70 hover:border-slate-500 hover:text-white hover:bg-slate-800/60 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Download size={17} />
                Descargar CV
              </a>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-800/80 max-w-lg"
            >
              <div>
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  7+
                </div>
                <div className="text-xs text-slate-400 mt-1 font-medium">Proyectos principales</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  5+
                </div>
                <div className="text-xs text-slate-400 mt-1 font-medium">Años de experiencia</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  ∞
                </div>
                <div className="text-xs text-slate-400 mt-1 font-medium">Aprendiendo siempre</div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Cinematic Portrait with Floating Tags */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-[460px] aspect-[4/5] flex items-center justify-center">
              {/* Radial Cyan Glow Aura */}
              <div className="absolute inset-4 bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />

              {/* Portrait Frame with Cyber Rim Light & Soft Mask */}
              <div className="relative w-full h-full rounded-3xl overflow-hidden border border-cyan-500/20 bg-gradient-to-b from-slate-900/60 to-[#060B18] shadow-2xl shadow-cyan-950/40">
                {/* Photo container with cyan duotone / dark blue cinematic tint */}
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                  <img
                    src="./profile-photo.png"
                    alt="Manuel Álvarez"
                    className="w-full h-full object-cover object-top filter contrast-125 brightness-95"
                    style={{
                      maskImage: 'radial-gradient(ellipse 90% 85% at 50% 45%, black 45%, transparent 95%)',
                      WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 45%, black 45%, transparent 95%)',
                    }}
                  />
                  {/* Cyberpunk Blue Neon Rim overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 via-transparent to-cyan-500/20 mix-blend-color-dodge pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060B18] via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Floating Cybernetic Badges (IA, WEB, APPS, SISTEMAS, </>) */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-start pl-2">
                <div className="relative w-full h-full flex flex-col justify-center gap-3">
                  {FLOATING_TAGS.map((tag) => (
                    <motion.div
                      key={tag.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{
                        opacity: 1,
                        x: [tag.x, tag.x + 6, tag.x],
                        y: [tag.y, tag.y - 4, tag.y],
                      }}
                      transition={{
                        opacity: { duration: 0.6, delay: 0.4 + tag.delay * 0.2 },
                        x: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: tag.delay },
                        y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: tag.delay },
                      }}
                      className="absolute left-0 pointer-events-auto cursor-default"
                    >
                      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-xl border border-cyan-400/40 shadow-lg shadow-cyan-500/10 hover:border-cyan-300 hover:shadow-cyan-400/30 transition-all group">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                        <span className="text-xs font-bold tracking-wider text-cyan-300 group-hover:text-white transition-colors">
                          {tag.label}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Animated scroll down indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
      >
        <a
          href="#proyectos"
          className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-cyan-400 transition-colors"
          aria-label="Ir a proyectos"
        >
          <span className="text-[10px] uppercase tracking-widest font-semibold">Scroll</span>
          <ArrowDown size={16} className="animate-bounce" />
        </a>
      </motion.div>
    </section>
  );
}
