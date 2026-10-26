import { motion } from 'framer-motion';
import { Monitor, Code, Bot, BookOpen } from 'lucide-react';

const SKILLS = [
  {
    icon: Monitor,
    title: 'Técnico de Sistemas',
    desc: 'Infraestructura y soporte',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  {
    icon: Code,
    title: 'Desarrollador',
    desc: 'Web, Apps y Herramientas',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  {
    icon: Bot,
    title: 'IA & Automatización',
    desc: 'Productividad y eficiencia',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  {
    icon: BookOpen,
    title: 'Aprendizaje continuo',
    desc: 'Siempre en evolución',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
];

export default function About() {
  return (
    <section id="sobre-mi" className="relative py-24 lg:py-32 overflow-hidden bg-[#040714]">
      {/* Ambient lighting */}
      <div className="absolute top-1/2 left-0 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column: Story & Motivation */}
          <div className="lg:col-span-6 space-y-7">
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Sobre Mí
              </span>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
            >
              <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
                Mi historia,
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  mi motivación
                </span>
              </h2>
            </motion.div>

            {/* Paragraph */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="text-slate-300 text-base sm:text-lg leading-relaxed"
            >
              Soy Técnico de Sistemas y actualmente estoy en constante crecimiento
              como desarrollador web, de apps y herramientas, integrando la inteligencia
              artificial en todo lo que hago. Me apasiona la tecnología, la automatización
              y la creación de soluciones que realmente aporten valor.
            </motion.p>

            {/* 4 Skill Cards Grid (2x2) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.24 }}
              className="grid grid-cols-2 gap-3 pt-2"
            >
              {SKILLS.map((skill) => {
                const Icon = skill.icon;
                return (
                  <div
                    key={skill.title}
                    className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0A1220]/95 border border-slate-800/80 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/20 transition-all space-y-2.5 group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{
                        background: skill.bgColor,
                        border: `1px solid ${skill.borderColor}`,
                      }}
                    >
                      <Icon size={19} style={{ color: skill.color }} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">
                        {skill.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium leading-snug">
                        {skill.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Quote Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.32 }}
              className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80"
            >
              <span className="text-3xl text-cyan-400 font-serif leading-none select-none">
                “
              </span>
              <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed pt-0.5">
                No se trata solo de programar, sino de resolver problemas reales con tecnología.
              </p>
            </motion.div>
          </div>

          {/* Right Column: Workstation Setup Photo from Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-6 relative flex items-center justify-center"
          >
            {/* Ambient workstation glow */}
            <div className="absolute -inset-2 bg-gradient-to-br from-cyan-500/20 via-blue-600/15 to-purple-600/10 rounded-3xl blur-2xl pointer-events-none" />

            {/* Workstation Photo Frame */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-cyan-950/40">
              <img
                src="./workstation.png"
                alt="Manuel Álvarez — Workstation & Development Environment"
                className="w-full h-auto object-cover rounded-3xl filter brightness-105 contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#040714] via-transparent to-transparent opacity-40 pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
