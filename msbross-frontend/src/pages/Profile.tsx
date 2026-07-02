import { motion } from 'framer-motion';
import { Shield, Brain, Terminal, Cpu } from 'lucide-react';

export default function Profile() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="flex flex-col lg:flex-row gap-16">
        {/* Left: Photo & Identification */}
        <div className="w-full lg:w-1/3 space-y-8">
          <motion.div 
            className="relative group"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Futuristic frame */}
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-magenta-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#0A101C]">
              <img 
                src="/profile-photo.png" 
                alt="Manu Alvarez"
                className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-700 opacity-80 hover:opacity-100 scale-105 group-hover:scale-100"
              />
              {/* Overlay grid pattern */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMCAwdjhINFIweiIgZmlsbD0icmdiYSgwLCAyMjksIDI1NSwgMC4wNCkiLz48L3N2Zz4=')] opacity-50 mix-blend-overlay pointer-events-none"></div>
            </div>

            {/* ID Badge overlay */}
            <div className="absolute -bottom-6 -right-6 glass-panel px-6 py-4 rounded-xl border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <div className="flex flex-col">
                <span className="font-mono text-cyan-400 text-xs font-bold tracking-widest uppercase mb-1">Level 3 Clearance</span>
                <span className="text-white font-bold text-lg">Manu Alvarez</span>
                <span className="text-gray-400 text-xs font-mono uppercase">ID: 675432813 // ARCHITECT</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Data Matrix */}
        <div className="w-full lg:w-2/3">
          <motion.div 
            className="space-y-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div>
              <h2 className="text-3xl font-extrabold mb-4 flex items-center gap-4">
                <Brain className="text-cyan-400 w-8 h-8" />
                Matriz de Identidad Operativa
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Arquitecto de Sistemas, Integrador de Inteligencia Artificial (Nivel 3) y desarrollador Full-Stack. 
                Especializado en la orquestación de microservicios robustos, agentes conversacionales autónomos y sistemas 
                de alta disponibilidad (99.9% Uptime). Cero-prose. Ejecución técnica directa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Certs */}
              <div className="bg-[#0A101C] border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Certificaciones & Core
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>
                    <div>
                      <div className="text-white font-medium">Sistemas Microinformáticos y Redes (SMR)</div>
                      <div className="text-gray-500 text-sm">ILERNA (2022-2023)</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>
                    <div>
                      <div className="text-white font-medium">Cisco CCST Networking & Cybersecurity</div>
                      <div className="text-gray-500 text-sm">Credencial Activa</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>
                    <div>
                      <div className="text-white font-medium">Six Sigma Yellow Belt</div>
                      <div className="text-gray-500 text-sm">Lean Optimization</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>
                    <div>
                      <div className="text-white font-medium">Scrum Fundamentals & Kanban (KEC)</div>
                      <div className="text-gray-500 text-sm">Metodologías Ágiles</div>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Experience */}
              <div className="bg-[#0A101C] border border-magenta-500/20 rounded-xl p-6">
                <h3 className="text-magenta-400 font-mono text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> Log de Experiencia
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-magenta-400 mt-2"></div>
                    <div>
                      <div className="text-white font-medium">Técnico Informático</div>
                      <div className="text-gray-500 text-sm">Teringo S.L.U. (2025)</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-magenta-400 mt-2"></div>
                    <div>
                      <div className="text-white font-medium">Operativa en Logística & Producción</div>
                      <div className="text-gray-500 text-sm">GB Foods / Döhler / Newton Energies</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-magenta-400 mt-2"></div>
                    <div>
                      <div className="text-white font-medium">Operario Logístico B2B</div>
                      <div className="text-gray-500 text-sm">Procter & Gamble (2020-2022 / 2025)</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Tech Stack Banner */}
            <div className="bg-gradient-to-r from-cyan-900/20 via-[#0A101C] to-magenta-900/20 border border-cyan-500/10 rounded-xl p-6 flex items-center gap-8">
              <Cpu className="w-12 h-12 text-cyan-400 opacity-80" />
              <div>
                <div className="text-sm text-cyan-400 font-mono uppercase tracking-wider mb-2">Pila Tecnológica Primaria</div>
                <div className="text-gray-300 font-medium">
                  React, Next.js, Node.js, FastAPI, Python, Docker, Traefik, Let's Encrypt, SQLite, Gemini, Groq, Llama, OpenAI, LiveKit WebRTC.
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
