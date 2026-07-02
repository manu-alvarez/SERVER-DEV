export default function Architecture() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="max-w-3xl mb-16">
        <div className="font-mono text-cyan-400 text-sm tracking-widest uppercase mb-4">
          INFRAESTRUCTURA / BLUEPRINT DE PRODUCCIÓN
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
          Arquitectura del Monorepo
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed mb-8">
          22 aplicaciones. Un proxy central en puerto 8080. PM2 como orquestador de 20 procesos. Túnel Cloudflare como única entrada pública. Todo en 127.0.0.1 — nada expuesto directamente.
        </p>

        <div className="flex gap-12 font-mono">
          <div>
            <div className="text-3xl font-bold text-cyan-400 mb-1">19</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Microservicios</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">20</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Procesos PM2</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-cyan-400 mb-1">8080</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Puerto Gateway</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">1</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Túnel Cloudflare</div>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <div className="text-xs font-mono uppercase text-cyan-500 mb-2 tracking-wider">Gateway</div>
        <h2 className="text-3xl font-bold text-white mb-6">msbross-proxy — Gateway Central (Puerto 8080)</h2>
        <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500/50 to-transparent mb-6" />
        <p className="text-gray-400 mb-10 max-w-2xl">
          proxy_server.js — Express.js + http-proxy-middleware. Primera y última línea de defensa. Cloudflared dirige msbross.me &rarr; 127.0.0.1:8080.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0a0f1d] border border-white/5 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">API Keys Vault</h3>
            <p className="text-sm text-gray-400">Carga credenciales desde api_keys_vault.json. Gemini, OpenAI, LiveKit. Nunca expuestas al frontend.</p>
          </div>
          <div className="bg-[#0a0f1d] border border-white/5 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">Rate Limiting</h3>
            <p className="text-sm text-gray-400">200 req/min por IP. Protección contra abuso y scraping.</p>
          </div>
          <div className="bg-[#0a0f1d] border border-white/5 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">CORS Estricto</h3>
            <p className="text-sm text-gray-400">Bloquea llamadas externas no autorizadas. Whitelist de orígenes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
