import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import ArchitectCockpit from './ArchitectCockpit';
import Glow from './Glow';

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-[92dvh] sm:min-h-[92svh] flex items-center overflow-hidden pt-28 pb-16 bg-[#060B18]"
    >
      {/* Premium background image — real IT dev workstation */}
      {/* NOTE: no CSS filter here — a filtered full-viewport layer is expensive
          for iOS WebKit compositing; opacity already dims it enough. */}
      <div
        className="absolute inset-0 z-0 opacity-[0.16] pointer-events-none"
        style={{
          backgroundImage: `url('/workstation.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Gradient overlay to guarantee text contrast over the photo */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#060B18] via-[#060B18]/70 to-transparent pointer-events-none" />

      {/* Cinematic ambient background glow — radial gradients (no filter layers) */}
      <Glow color="rgba(37, 99, 235, 0.15)" className="w-[600px] h-[600px] top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2" />
      <Glow color="rgba(6, 182, 212, 0.18)" className="w-[550px] h-[550px] top-1/3 right-1/4" />
      <Glow color="rgba(147, 51, 234, 0.12)" className="w-[500px] h-[500px] bottom-10 right-10" />

      {/* Subtle background tech grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column (Typography & CTAs) */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-7">
            {/* Availability Pill */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold tracking-wide shadow-sm shadow-emerald-950/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Disponible para proyectos
              </span>
            </motion.div>

            {/* Name Heading with Studio Display Font */}
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

            {/* Clean Stats Row (7+ Proyectos removed as requested) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-8 pt-8 border-t border-slate-800/80 max-w-lg"
            >
              <div>
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  5+
                </div>
                <div className="text-xs text-slate-400 mt-1 font-medium">Años de experiencia</div>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  100%
                </div>
                <div className="text-xs text-slate-400 mt-1 font-medium">Producción propia</div>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  ∞
                </div>
                <div className="text-xs text-slate-400 mt-1 font-medium">Aprendiendo siempre</div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: 3D Cyber-Architect Cockpit */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-6 relative flex items-center justify-center lg:justify-end w-full"
          >
            <ArchitectCockpit />
          </motion.div>
        </div>
      </div>

      {/* Animated scroll down indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
      >
        <a
          href="#proyectos"
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-cyan-400 transition-colors"
          aria-label="Ir a proyectos"
        >
          <span className="text-[10px] uppercase tracking-widest font-semibold">Scroll</span>
          <ArrowDown size={15} className="animate-bounce" />
        </a>
      </motion.div>
    </section>
  );
}
