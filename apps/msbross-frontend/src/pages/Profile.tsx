import { motion, type Variants } from 'framer-motion';
import { Shield, Brain, Terminal, Code2, Network } from 'lucide-react';

export default function Profile() {
  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVars: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 min-h-[85vh]">
      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* Left Column: Photo & Core Identity */}
        <div className="lg:col-span-4 space-y-8">
          <motion.div variants={itemVars} className="relative group">
            {/* Cinematic background glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-magenta-500/20 rounded-[2.5rem] blur-2xl group-hover:blur-3xl transition-all duration-700 opacity-70 group-hover:opacity-100"></div>
            
            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 bg-[#050B14] shadow-2xl">
              <img 
                src="/profile-photo.png" 
                alt="Manu Alvarez"
                className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-700 opacity-80 hover:opacity-100 scale-105 group-hover:scale-100 filter contrast-125"
              />
              
              {/* Cyber overlay elements */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A101C] via-transparent to-transparent opacity-80"></div>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMCAwdjhINFIweiIgZmlsbD0icmdiYSgwLCAyMjksIDI1NSwgMC4wNCkiLz48L3N2Zz4=')] opacity-30 mix-blend-overlay pointer-events-none"></div>
              
              {/* Internal Badge */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                  <span className="font-mono text-cyan-400 text-xs font-bold tracking-[0.2em] uppercase">Status: Online</span>
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-1">Manu Alvarez</h1>
                <p className="text-gray-400 font-mono text-sm uppercase tracking-wider">Técnico de Sistemas & Desarrollador</p>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Bento */}
          <motion.div variants={itemVars} className="grid grid-cols-2 gap-4">
            <div className="bg-[#0A101C]/60 backdrop-blur-md border border-white/5 rounded-3xl p-5 hover:border-cyan-500/30 transition-colors group">
              <Code2 className="w-6 h-6 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-2xl font-bold text-white mb-1">24+</div>
              <div className="text-xs text-gray-500 font-mono uppercase tracking-wider">Apps Deployadas</div>
            </div>
            <div className="bg-[#0A101C]/60 backdrop-blur-md border border-white/5 rounded-3xl p-5 hover:border-magenta-500/30 transition-colors group">
              <Brain className="w-6 h-6 text-magenta-400 mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-2xl font-bold text-white mb-1">AI</div>
              <div className="text-xs text-gray-500 font-mono uppercase tracking-wider">Integración Nativa</div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-8 space-y-8">
          <motion.div variants={itemVars} className="bg-[#0A101C]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 md:p-10 relative overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Sobre Mí</span>
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                Técnico informático y desarrollador autodidacta apasionado por la creación de herramientas prácticas. 
                Centrado en la programación web moderna, el despliegue de sistemas, la integración de Inteligencia Artificial 
                y la automatización de procesos. Mi objetivo es mejorar el día a día creando soluciones útiles, 
                reales y funcionales tanto a nivel logístico como de desarrollo.
              </p>

              {/* Tech Stack Horizontal Scroll/Flex */}
              <div className="flex flex-col gap-3">
                <div className="text-xs text-cyan-400 font-mono uppercase tracking-widest flex items-center gap-2">
                  <Network className="w-4 h-4" /> Tech Stack Core
                </div>
                <div className="flex flex-wrap gap-2">
                  {['React 19', 'Next.js 15', 'Node.js', 'FastAPI', 'Python', 'Docker', 'Traefik', 'Gemini AI', 'LiveKit WebRTC', 'TailwindCSS'].map((tech) => (
                    <span key={tech} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-gray-300 hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-default">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Certifications */}
            <motion.div variants={itemVars} className="bg-[#0A101C]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 group hover:border-cyan-500/20 transition-all">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Certificaciones</h3>
              </div>
              
              <ul className="space-y-6 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-white/5">
                {[
                  { title: 'Sistemas Microinformáticos y Redes (SMR)', desc: 'ILERNA (2022-2023)' },
                  { title: 'Cisco CCST Networking & Cybersecurity', desc: 'Credencial Activa' },
                  { title: 'Six Sigma Yellow Belt', desc: 'Lean Optimization' },
                  { title: 'Scrum Fundamentals (SFC) & Kanban', desc: 'Metodologías Ágiles' }
                ].map((item, idx) => (
                  <li key={idx} className="relative pl-8">
                    <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#0A101C] border-[3px] border-cyan-500/30 group-hover:border-cyan-400 transition-colors z-10"></div>
                    <div className="text-white font-medium mb-1">{item.title}</div>
                    <div className="text-gray-500 text-sm">{item.desc}</div>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Experience */}
            <motion.div variants={itemVars} className="bg-[#0A101C]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 group hover:border-magenta-500/20 transition-all">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-xl bg-magenta-500/10 text-magenta-400">
                  <Terminal className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Log de Experiencia</h3>
              </div>
              
              <ul className="space-y-6 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-white/5">
                {[
                  { title: 'Técnico Informático', desc: 'Teringo S.L.U. (2025)' },
                  { title: 'Operativa en Logística & Producción', desc: 'GB Foods / Döhler / Newton Energies' },
                  { title: 'Operario Logístico B2B', desc: 'Procter & Gamble (2020-2022 / 2025)' }
                ].map((item, idx) => (
                  <li key={idx} className="relative pl-8">
                    <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#0A101C] border-[3px] border-magenta-500/30 group-hover:border-magenta-400 transition-colors z-10"></div>
                    <div className="text-white font-medium mb-1">{item.title}</div>
                    <div className="text-gray-500 text-sm">{item.desc}</div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
