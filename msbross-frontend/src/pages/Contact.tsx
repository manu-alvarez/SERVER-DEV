import { motion } from 'framer-motion';
import { Send, MapPin, Mail, Phone, Lock } from 'lucide-react';

export default function Contact() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20 min-h-[85vh] flex flex-col justify-center">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
          Inicializar <span className="text-cyan-400">Conexión</span>
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Canal de comunicación directa con el arquitecto del sistema. Para propuestas de proyectos, auditorías o integraciones IA.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left: Contact Info */}
        <div className="w-full lg:w-1/3 space-y-8">
          <motion.div 
            className="bg-[#0A101C] border border-cyan-500/20 rounded-2xl p-8 shadow-[0_0_30px_rgba(6,182,212,0.1)]"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-xl font-bold mb-8 text-white flex items-center gap-3">
              <Lock className="text-cyan-400 w-5 h-5" />
              Secure Channel
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <Mail className="text-cyan-400 w-5 h-5" />
                </div>
                <div>
                  <div className="text-gray-400 text-sm font-mono uppercase mb-1">Email Principal</div>
                  <a href="mailto:manuelalvarezdianez@gmail.com" className="text-white hover:text-cyan-400 transition-colors font-medium">
                    manuelalvarezdianez@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-magenta-900/30 border border-magenta-500/30 flex items-center justify-center shrink-0">
                  <Phone className="text-magenta-400 w-5 h-5" />
                </div>
                <div>
                  <div className="text-gray-400 text-sm font-mono uppercase mb-1">Línea Directa</div>
                  <a href="tel:+34675432813" className="text-white hover:text-magenta-400 transition-colors font-medium">
                    +34 675 43 28 13
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-900/30 border border-green-500/30 flex items-center justify-center shrink-0">
                  <MapPin className="text-green-400 w-5 h-5" />
                </div>
                <div>
                  <div className="text-gray-400 text-sm font-mono uppercase mb-1">Ubicación Base</div>
                  <div className="text-white font-medium">
                    Mequinenza, Zaragoza (España)
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Contact Form */}
        <div className="w-full lg:w-2/3">
          <motion.form 
            action="https://formsubmit.co/manuelalvarezdianez@gmail.com" 
            method="POST"
            className="bg-[#0A101C]/50 backdrop-blur-md border border-gray-800 rounded-2xl p-8 lg:p-10"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* FormSubmit Config */}
            <input type="hidden" name="_subject" value="Nuevo mensaje desde MSBross.me!" />
            <input type="hidden" name="_template" value="table" />
            <input type="hidden" name="_captcha" value="false" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-gray-400 text-sm font-mono uppercase ml-1">Identificador (Nombre)</label>
                <input 
                  type="text"
                  name="name"
                  required
                  className="w-full bg-[#050B14] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="Ej. John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-gray-400 text-sm font-mono uppercase ml-1">Dirección de Retorno (Email)</label>
                <input 
                  type="email"
                  name="email"
                  required
                  className="w-full bg-[#050B14] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-magenta-500 transition-colors"
                  placeholder="john@empresa.com"
                />
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <label className="text-gray-400 text-sm font-mono uppercase ml-1">Carga de Datos (Mensaje)</label>
              <textarea 
                name="message"
                required
                rows={6}
                className="w-full bg-[#050B14] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                placeholder="Detalla los requerimientos del sistema..."
              ></textarea>
            </div>

            <button 
              type="submit"
              className="w-full group bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/50 hover:border-cyan-400 text-cyan-400 px-6 py-4 rounded-lg font-bold tracking-wide transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-3"
            >
              Transmitir Datos
              <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
