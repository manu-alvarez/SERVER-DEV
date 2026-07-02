export default function SaaS() {
  const apps = [
    { name: "TXA Fitness Pro", desc: "Behavioral Change Modeling & Diagnostic Funnel", url: "txa-fitness.service", color: "border-yellow-500/30" },
    { name: "EliteScout", desc: "Family Travel Finder & Scouting Platform", url: "elitescout.service", color: "border-cyan-500/30" },
    { name: "Perfume Trading", desc: "Plataforma B2B de comercio de perfumería", url: "perfume-trading.service", color: "border-orange-500/30" },
    { name: "IndustrialPro", desc: "Gestión de Mantenimiento Industrial", url: "industrialpro.service", color: "border-orange-500/30" },
    { name: "Mapfre InfoCol", desc: "Dashboard Automatización Siniestros", url: "mapfre.service", color: "border-yellow-500/30" },
    { name: "Traductor Pro", desc: "Herramienta traducción corporativa", url: "traductor.service", color: "border-green-500/30" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="max-w-3xl mb-16">
        <div className="font-mono text-cyan-400 text-sm tracking-widest uppercase mb-4">
          SAAS PLATFORMS / +20 APPS
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
          El Ecosistema Completo
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed mb-8">
          Más de 20 aplicaciones en producción. Frontends Next.js y React, agentes IA con WebRTC, APIs de microservicios y herramientas industriales B2B. Todo enrutado por un único proxy Express.
        </p>

        <div className="flex gap-12 font-mono">
          <div>
            <div className="text-3xl font-bold text-white mb-1">20</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Frontends activos</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-cyan-400 mb-1">14</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">APIs de microservicios</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">1</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Proxy central</div>
          </div>
        </div>
      </div>

      <div className="text-xs font-mono uppercase text-gray-500 mb-4 tracking-wider">Frontends y SaaS</div>
      <p className="text-sm text-gray-400 mb-6">Aplicaciones visuales en producción — Next.js, React, Vite.</p>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
        <button className="px-4 py-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-sm whitespace-nowrap font-mono">Todos (20)</button>
        <button className="px-4 py-2 rounded text-gray-400 border border-white/10 hover:bg-white/5 text-sm whitespace-nowrap font-mono">Plataformas IA (4)</button>
        <button className="px-4 py-2 rounded text-gray-400 border border-white/10 hover:bg-white/5 text-sm whitespace-nowrap font-mono">Agentes & WebRTC (3)</button>
        <button className="px-4 py-2 rounded text-gray-400 border border-white/10 hover:bg-white/5 text-sm whitespace-nowrap font-mono">Industrial & B2B (4)</button>
        <button className="px-4 py-2 rounded text-gray-400 border border-white/10 hover:bg-white/5 text-sm whitespace-nowrap font-mono">Utilidades (4)</button>
        <button className="px-4 py-2 rounded text-gray-400 border border-white/10 hover:bg-white/5 text-sm whitespace-nowrap font-mono">Micro-Frontends (5)</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app, i) => (
          <div key={i} className={`bg-[#0a0f1d] border ${app.color} rounded-lg p-5 hover:bg-[#0f1629] transition-colors`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="flex items-center gap-1.5 border border-green-500/30 bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded font-mono uppercase">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                online
              </div>
            </div>
            
            <div className="font-mono text-xs text-gray-500 mb-2">{app.url}</div>
            <h3 className="text-lg font-bold text-white mb-1">{app.name}</h3>
            <p className="text-sm text-cyan-400/80 leading-snug">{app.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
