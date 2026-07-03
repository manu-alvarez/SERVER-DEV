import { motion, type Variants } from 'framer-motion';
import { Send, MapPin, Mail, Phone, BookUser, Code } from 'lucide-react';

export default function Contact() {
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
    <div className="max-w-7xl mx-auto px-6 py-12 min-h-[85vh] flex flex-col justify-center">
      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="text-center mb-16"
      >
        <motion.div variants={itemVars} className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-cyan-950/40 border border-cyan-500/30">
          <Send className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Abierto a contacto</span>
        </motion.div>
        <motion.h2 variants={itemVars} className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          Contacto <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">Directo</span>
        </motion.h2>
        <motion.p variants={itemVars} className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
          Si quieres contactar para propuestas, colaboraciones o cualquier otra cosa, tienes las puertas abiertas.
        </motion.p>
      </motion.div>

      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="flex flex-col lg:flex-row gap-12"
      >
        {/* Left: Contact Info & CV */}
        <div className="w-full lg:w-1/3 space-y-8">
          {/* CV Profile Card */}
          <motion.div 
            variants={itemVars}
            className="bg-[#0A101C]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-500"
          >
            {/* Ambient glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-cyan-500/30 transition-colors duration-500"></div>
            
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-cyan-400 to-magenta-500 mb-6 group-hover:rotate-180 transition-transform duration-1000">
                <div className="w-full h-full rounded-full bg-[#050B14] overflow-hidden group-hover:-rotate-180 transition-transform duration-1000">
                  <img src="/profile-photo.png" alt="Manuel Álvarez Diánez" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=Manuel+Alvarez&background=0A101C&color=06b6d4' }} />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-2 tracking-wide group-hover:text-cyan-400 transition-colors">Manuel Álvarez</h2>
              <div className="px-3 py-1 bg-white/5 rounded-md border border-white/10 text-cyan-400 font-mono text-xs mb-4 uppercase tracking-wider">
                Técnico & Programador
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Técnico informático orientado a buscar soluciones. Creo aplicaciones web, gestiono servidores y automatizo procesos para mejorar el día a día.
              </p>
            </div>
            
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-6"></div>

            <h3 className="text-xs font-bold mb-6 text-gray-500 font-mono uppercase tracking-widest flex items-center gap-3">
              <BookUser className="text-cyan-400 w-3 h-3" />
              Información de Contacto
            </h3>
            
            <div className="space-y-6 relative z-10">
              <a href="mailto:manuelalvarezdianez@hotmail.com" className="flex items-center gap-4 group/link">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 group-hover/link:bg-cyan-400 group-hover/link:text-[#0A101C] transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-0.5">Email Principal</div>
                  <div className="text-white group-hover/link:text-cyan-400 transition-colors font-medium text-sm">manuelalvarezdianez@hotmail.com</div>
                </div>
              </a>

              <a href="mailto:manuelalvarezdianez@gmail.com" className="flex items-center gap-4 group/link">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 group-hover/link:bg-blue-400 group-hover/link:text-[#0A101C] transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-0.5">Email Secundario</div>
                  <div className="text-white group-hover/link:text-blue-400 transition-colors font-medium text-sm">manuelalvarezdianez@gmail.com</div>
                </div>
              </a>

              <a href="tel:+34651352065" className="flex items-center gap-4 group/link">
                <div className="w-10 h-10 rounded-xl bg-magenta-500/10 text-magenta-400 flex items-center justify-center shrink-0 group-hover/link:bg-magenta-400 group-hover/link:text-[#0A101C] transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-0.5">Teléfono</div>
                  <div className="text-white group-hover/link:text-magenta-400 transition-colors font-medium text-sm">+34 651 35 20 65</div>
                </div>
              </a>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-0.5">Ubicación</div>
                  <div className="text-white font-medium text-sm">Zaragoza, España</div>
                </div>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-4"></div>

              <a href="https://github.com/manu-alvarez" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group/link">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 group-hover/link:bg-purple-400 group-hover/link:text-[#0A101C] transition-colors">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-0.5">GitHub</div>
                  <div className="text-white group-hover/link:text-purple-400 transition-colors font-medium text-sm">github.com/manu-alvarez</div>
                </div>
              </a>

              <a href="https://www.linkedin.com/in/manu-alvarez-dev/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group/link">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover/link:bg-blue-500/20 transition-colors border border-blue-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-400"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </div>
                <div>
                  <div className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-0.5">LinkedIn</div>
                  <div className="text-white group-hover/link:text-blue-400 transition-colors font-medium text-sm">linkedin.com/in/manu-alvarez-dev</div>
                </div>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Right: Contact Form */}
        <div className="w-full lg:w-2/3">
          <motion.form 
            variants={itemVars}
            action="https://formsubmit.co/manuelalvarezdianez@hotmail.com" 
            method="POST"
            className="bg-[#0A101C]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 md:p-12 h-full flex flex-col relative overflow-hidden"
          >
            {/* Ambient glow */}
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-magenta-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* FormSubmit Config */}
            <input type="hidden" name="_subject" value="Nuevo mensaje desde MSBross.me!" />
            <input type="hidden" name="_template" value="table" />
            <input type="hidden" name="_captcha" value="false" />

            <div className="flex items-center gap-3 mb-8 relative z-10">
              <Mail className="text-cyan-400 w-5 h-5" />
              <h3 className="text-xl font-bold text-white">Enviar Mensaje</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
              <div className="space-y-3">
                <label className="text-gray-400 text-xs font-mono uppercase tracking-widest pl-1">Nombre</label>
                <input 
                  type="text"
                  name="name"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-cyan-500 focus:bg-cyan-500/5 transition-all placeholder:text-gray-600"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-3">
                <label className="text-gray-400 text-xs font-mono uppercase tracking-widest pl-1">Email</label>
                <input 
                  type="email"
                  name="email"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-magenta-500 focus:bg-magenta-500/5 transition-all placeholder:text-gray-600"
                  placeholder="john@empresa.com"
                />
              </div>
            </div>

            <div className="space-y-3 mb-10 flex-1 relative z-10">
              <label className="text-gray-400 text-xs font-mono uppercase tracking-widest pl-1">Mensaje</label>
              <textarea 
                name="message"
                required
                className="w-full h-48 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-cyan-500 focus:bg-cyan-500/5 transition-all placeholder:text-gray-600 resize-none"
                placeholder="Escribe tu mensaje aquí..."
              ></textarea>
            </div>

            <button 
              type="submit"
              className="w-full group relative inline-flex items-center justify-center px-8 py-5 font-bold text-white transition-all duration-200 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl overflow-hidden hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] focus:outline-none z-10"
            >
              <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-full group-hover:h-56 opacity-10"></span>
              <span className="relative flex items-center gap-3">
                Enviar Mensaje
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </span>
            </button>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
