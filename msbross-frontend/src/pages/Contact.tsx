export default function Contact() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row gap-16">
      <div className="w-full lg:w-1/2">
        <div className="font-mono text-magenta-500 text-sm tracking-widest uppercase mb-4">
          INTEGRACIÓN / CONTACTO
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
          Conecta con el Ecosistema
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed mb-16">
          ¿Quieres integrar un agente IA, escalar una plataforma SaaS o colaborar en arquitectura de microservicios? Hablemos.
        </p>

        <div className="text-xs font-mono uppercase text-cyan-500 mb-4 tracking-wider">Subdominios y Contacto Directo</div>
        <div className="space-y-4">
          <div className="bg-[#0a0f1d] border border-cyan-500/20 rounded-lg p-5">
            <h3 className="font-bold text-white mb-1">Gateway Principal (API)</h3>
            <a href="https://proxy.msbross.me" className="text-cyan-400 text-sm hover:underline">https://proxy.msbross.me</a>
            <p className="text-gray-500 text-sm mt-2">Punto de entrada a todos los microservicios.</p>
          </div>
          <div className="bg-[#0a0f1d] border border-cyan-500/20 rounded-lg p-5">
            <h3 className="font-bold text-white mb-1">Ecosistema & Portfolio</h3>
            <a href="https://manuelalvarez.dev" className="text-cyan-400 text-sm hover:underline">https://manuelalvarez.dev</a>
            <p className="text-gray-500 text-sm mt-2">Landing pública del ecosistema MSBrossAI.</p>
          </div>
          <div className="bg-[#0a0f1d] border border-cyan-500/20 rounded-lg p-5">
            <h3 className="font-bold text-white mb-1">Contacto Directo</h3>
            <div className="flex flex-col gap-2 mt-2">
              <a href="mailto:manuelalvarezdianez@hotmail.com" className="text-cyan-400 text-sm hover:underline">✉️ manuelalvarezdianez@hotmail.com</a>
              <a href="tel:+34651352065" className="text-cyan-400 text-sm hover:underline">📱 +34 651 352 065</a>
              <a href="https://linkedin.com/in/manu-alvarez-dev" target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-sm hover:underline">💼 LinkedIn: manu-alvarez-dev</a>
              <a href="https://github.com/manu-alvarez" target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-sm hover:underline">💻 GitHub: manu-alvarez</a>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2">
        <div className="bg-[#110a17] border border-magenta-500/20 rounded-xl p-8 sticky top-32">
          <h2 className="text-2xl font-bold mb-2">Propuesta de Integración</h2>
          <p className="text-sm text-gray-400 mb-8">Describe tu caso de uso. Respondo en menos de 24h.</p>

          <form className="space-y-6">
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase mb-2">Nombre / Empresa</label>
              <input type="text" className="w-full bg-[#050811] border border-magenta-500/30 rounded p-3 text-white focus:outline-none focus:border-magenta-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase mb-2">Email de contacto</label>
              <input type="email" className="w-full bg-[#050811] border border-magenta-500/30 rounded p-3 text-white focus:outline-none focus:border-magenta-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase mb-2">Tipo de integración</label>
              <select className="w-full bg-[#050811] border border-magenta-500/30 rounded p-3 text-white focus:outline-none focus:border-magenta-500 transition-colors appearance-none">
                <option>Selecciona...</option>
                <option>Agente IA (Voz/Texto)</option>
                <option>SaaS Custom</option>
                <option>Arquitectura Cloud</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase mb-2">Describe tu proyecto o necesidad</label>
              <textarea rows={4} className="w-full bg-[#050811] border border-magenta-500/30 rounded p-3 text-white focus:outline-none focus:border-magenta-500 transition-colors" />
            </div>
            <button type="button" className="w-full bg-magenta-500 hover:bg-magenta-600 text-white font-bold py-3 px-4 rounded transition-colors">
              Enviar Propuesta
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
