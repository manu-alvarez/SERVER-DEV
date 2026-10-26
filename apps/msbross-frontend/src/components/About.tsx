import { motion } from 'framer-motion';
import { Monitor, Code, Bot, BookOpen } from 'lucide-react';

const SKILLS = [
  {
    icon: Monitor,
    title: 'Técnico de Sistemas',
    desc: 'Infraestructura y soporte',
    color: '#3B82F6',
  },
  {
    icon: Code,
    title: 'Desarrollador',
    desc: 'Web, Apps y herramientas',
    color: '#8B5CF6',
  },
  {
    icon: Bot,
    title: 'IA & Automatización',
    desc: 'Productividad y eficiencia',
    color: '#06B6D4',
  },
  {
    icon: BookOpen,
    title: 'Aprendizaje continuo',
    desc: 'Siempre en evolución',
    color: '#10B981',
  },
];

export default function About() {
  return (
    <section id="sobre-mi" className="relative py-24 lg:py-32 section-glow overflow-hidden">
      {/* Ambient */}
      <div className="orb w-[600px] h-[600px] bg-purple-800 -bottom-40 -left-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-3">
                Sobre mí
              </p>
              <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                Mi historia,
                <br />
                <span className="gradient-text">mi motivación</span>
              </h2>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-text-secondary text-lg leading-relaxed"
            >
              Soy Técnico de Sistemas y actualmente estoy en constante crecimiento
              como desarrollador web, de apps y herramientas, integrando la inteligencia
              artificial en todo lo que hago. Me apasiona la tecnología, la automatización
              y la creación de soluciones que realmente aporten valor.
            </motion.p>

            {/* Skill Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-3"
            >
              {SKILLS.map((skill, i) => {
                const Icon = skill.icon;
                return (
                  <motion.div
                    key={skill.title}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="glass-card p-4 flex flex-col items-center text-center gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${skill.color}20` }}
                    >
                      <Icon size={20} style={{ color: skill.color }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{skill.title}</h4>
                      <p className="text-xs text-text-muted mt-0.5">{skill.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Quote */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex gap-4 items-start pt-4 border-t border-white/10"
            >
              <span className="text-4xl text-blue-500/40 font-serif leading-none">"</span>
              <p className="text-text-secondary italic text-sm leading-relaxed">
                No se trata solo de programar, sino de resolver problemas reales con tecnología.
              </p>
            </motion.div>
          </div>

          {/* Right: Profile Photo */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              {/* Glow behind photo */}
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl" />

              {/* Profile photo */}
              <img
                src="./profile-photo.png"
                alt="Manuel Álvarez — Setup de trabajo"
                className="relative w-full h-full object-cover rounded-2xl border border-white/10 shadow-2xl shadow-blue-500/10"
              />

              {/* Gradient overlay bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/60 via-transparent to-transparent rounded-2xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
