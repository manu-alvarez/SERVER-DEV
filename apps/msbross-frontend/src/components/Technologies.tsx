import { motion } from 'framer-motion';
import { TECHNOLOGIES } from '../data/projects';
import Glow from './Glow';

export default function Technologies() {
  return (
    <section id="tecnologias" className="relative py-24 lg:py-32 overflow-hidden bg-[#060B18]">
      {/* Ambient background glow — radial gradients (iOS-safe) */}
      <Glow color="rgba(8, 145, 178, 0.12)" className="w-[500px] h-[500px] top-1/3 left-1/4" />
      <Glow color="rgba(37, 99, 235, 0.12)" className="w-[500px] h-[500px] bottom-10 right-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wider uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Stack & Competencias
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-4xl sm:text-5xl font-black text-white tracking-tight"
          >
            Tecnologías
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="text-slate-400 mt-4 text-base sm:text-lg"
          >
            Herramientas y tecnologías que utilizo y con las que trabajo a diario en producción.
          </motion.p>
        </div>

        {/* 12 Real Tech Tiles Grid (4 Columns x 3 Rows) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {TECHNOLOGIES.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="p-5 rounded-2xl bg-gradient-to-b from-[#0E1E3D]/90 to-[#0A1628]/95 border border-slate-800/80 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-950/25 transition-all flex flex-col items-center justify-center gap-3 group cursor-default"
            >
              <div
                className="w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-center p-2.5 transition-transform group-hover:scale-110 shadow-inner [&>svg]:w-6 [&>svg]:h-6 [&>svg]:shrink-0"
                dangerouslySetInnerHTML={{ __html: tech.svg }}
              />
              <span className="text-xs sm:text-sm font-bold text-slate-300 group-hover:text-white transition-colors text-center">
                {tech.name}
              </span>
              <span className="text-[10px] text-cyan-400/80 font-mono -mt-1">
                {tech.category}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Quote Footer with Luminous Wave */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center max-w-xl mx-auto space-y-4"
        >
          <p className="text-xs sm:text-sm font-medium text-slate-400 italic">
            "... La tecnología cambia, la curiosidad me mantiene."
          </p>

          {/* Luminous Neon Wave Divider */}
          <div className="relative h-6 flex items-center justify-center">
            <svg
              className="w-64 h-4 text-cyan-500/40 overflow-visible"
              viewBox="0 0 256 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 8C32 2 48 14 80 8C112 2 128 14 160 8C192 2 208 14 256 8"
                stroke="url(#wave-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="wave-gradient" x1="0" y1="8" x2="256" y2="8" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00d2ff" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#00d2ff" />
                  <stop offset="1" stopColor="#7928ca" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
