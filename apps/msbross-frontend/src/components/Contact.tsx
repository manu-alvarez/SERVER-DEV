import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, AlertCircle, Mail, Download, MessageSquare } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Error al enviar el mensaje.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Error de conexión. Puedes contactarme directamente por WhatsApp o Email.');
    }
  };

  return (
    <section id="contacto" className="relative py-24 lg:py-32 bg-[#040714]">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 right-10 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left: Mobile Phone Device Mockup (Panel 6 of Mockup) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5 hidden lg:flex justify-center"
          >
            <div className="w-[300px] rounded-[40px] p-3.5 bg-gradient-to-b from-slate-800 to-slate-950 border-2 border-slate-700/80 shadow-2xl shadow-cyan-950/40 relative">
              {/* Dynamic Island / Speaker Notch */}
              <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              </div>

              {/* Screen Content */}
              <div className="rounded-[30px] bg-gradient-to-b from-[#0B132B] to-[#040714] p-5 border border-slate-800/80 text-center space-y-4">
                {/* Mini Profile Photo */}
                <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-cyan-400/30 shadow-lg shadow-cyan-500/20">
                  <img
                    src="./profile-photo.png"
                    alt="Manuel Álvarez"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">Manuel Álvarez</h4>
                  <p className="text-[11px] text-cyan-400 font-medium">Técnico de Sistemas & Dev</p>
                </div>

                {/* Mini Navigation Menu */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-300 font-medium">
                  <a href="#inicio" className="block p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800">Inicio</a>
                  <a href="#proyectos" className="block p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800">Proyectos</a>
                  <a href="#sobre-mi" className="block p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800">Sobre mí</a>
                  <a href="#tecnologias" className="block p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800">Tecnologías</a>
                  <a href="#contacto" className="block p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    Contacto
                  </a>
                </div>

                {/* Mini CV Button */}
                <div className="pt-2">
                  <a
                    href="/app/cv/CV-Manuel_Alvarez_Dianez.pdf"
                    download="CV-Manuel_Alvarez_Dianez.pdf"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-[11px] font-semibold hover:bg-slate-700 transition-colors"
                  >
                    <Download size={13} />
                    Descargar CV
                  </a>
                </div>

                {/* Social icons row */}
                <div className="flex items-center justify-center gap-4 pt-2 text-slate-400">
                  <a href="https://github.com/manu-alvarez" target="_blank" rel="noreferrer" className="hover:text-white" aria-label="GitHub">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  </a>
                  <a href="https://linkedin.com/in/manu-alvarez-dev" target="_blank" rel="noreferrer" className="hover:text-white" aria-label="LinkedIn">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Hablemos & Contact Form */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wider uppercase mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Contacto Directo
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                Hablemos
              </h2>
              <p className="text-slate-400 mt-2 text-base sm:text-lg">
                ¿Tienes un proyecto en mente o quieres saber más sobre mi trabajo? Escríbeme directamente.
              </p>
            </motion.div>

            {/* Direct Contact Cards (WhatsApp, Email, LinkedIn) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="grid sm:grid-cols-3 gap-3"
            >
              {/* WhatsApp direct */}
              <a
                href="https://wa.me/34651352065?text=Hola%20Manuel%2C%20he%20visto%20tu%20portfolio"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-gradient-to-b from-[#0A1224]/90 to-[#040714]/95 border border-slate-800/80 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/20 transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                    WhatsApp
                  </span>
                  <span className="text-xs font-bold text-white truncate block group-hover:text-emerald-300 transition-colors">
                    +34 651 352 065
                  </span>
                </div>
              </a>

              {/* Email direct */}
              <a
                href="mailto:manuelalvarezdianez@hotmail.com"
                className="p-4 rounded-2xl bg-gradient-to-b from-[#0A1224]/90 to-[#040714]/95 border border-slate-800/80 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-950/20 transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Mail size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Email
                  </span>
                  <span className="text-xs font-bold text-white truncate block group-hover:text-cyan-300 transition-colors">
                    manuelalvarezdianez@hotmail.com
                  </span>
                </div>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com/in/manu-alvarez-dev"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-gradient-to-b from-[#0A1224]/90 to-[#040714]/95 border border-slate-800/80 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-950/20 transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                    LinkedIn
                  </span>
                  <span className="text-xs font-bold text-white truncate block group-hover:text-blue-300 transition-colors">
                    /in/manu-alvarez-dev
                  </span>
                </div>
              </a>
            </motion.div>

            {/* Contact Form with Backend Persistence */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSubmit}
              className="rounded-3xl bg-gradient-to-b from-[#0A1224]/90 to-[#040714]/95 border border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Nombre *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Asunto
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm"
                  placeholder="¿De qué se trata?"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Mensaje *
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm resize-none"
                  placeholder="Cuéntame sobre tu proyecto o consulta..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#00d2ff] via-blue-600 to-[#7928ca] text-white font-bold text-sm shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando al servidor...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Enviar mensaje
                  </>
                )}
              </button>

              {/* Status feedback */}
              {status === 'success' && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle size={16} />
                    ¡Mensaje registrado correctamente en el servidor!
                  </div>
                  <p className="text-slate-300">
                    Manuel se pondrá en contacto contigo pronto. Si prefieres respuesta inmediata, escríbele por{' '}
                    <a
                      href="https://wa.me/34651352065?text=Hola%20Manuel%2C%20te%20he%20dejado%20un%20mensaje%20en%20la%20web"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 font-bold underline"
                    >
                      WhatsApp
                    </a>.
                  </p>
                </div>
              )}

              {status === 'error' && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}
            </motion.form>
          </div>
        </div>
      </div>
    </section>
  );
}
