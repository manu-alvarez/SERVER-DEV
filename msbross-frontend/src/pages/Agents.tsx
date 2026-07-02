export default function Agents() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="max-w-3xl mb-16">
        <div className="font-mono text-magenta-500 text-sm tracking-widest uppercase mb-4">
          AI CORES / LIVEKIT + WEBRTC
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
          Agentes Conversacionales en Tiempo Real
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed">
          Dos agentes de voz construidos sobre LiveKit Agents Framework, Python 3.14 y Gemini Flash Live. Latencia sub-segundo. Cero intermediarios.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nikolina Card */}
        <div className="bg-[#0a0f1d] border border-magenta-500/20 rounded-xl p-8 hover:border-magenta-500/50 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-magenta-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex justify-between items-start mb-4">
            <div className="text-magenta-500 font-mono text-xs uppercase tracking-wider">Agente de voz para restaurantes y hostelería</div>
            <div className="flex items-center gap-2 border border-green-500/30 bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              online
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-4">Nikolina — Asistente de Hostelería</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Motor central de WebRTC para gestión conversacional en hostelería. Enruta tokens por room prefix para despachar usuarios al agente correcto. Voz sintetizada con Aoede (Google TTS nativa). System Prompts estrictos para comportamiento de restaurante.
          </p>

          <div className="text-magenta-500 text-sm font-bold tracking-wider uppercase mb-4">Capacidades</div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2"><span className="text-magenta-500">•</span> Enrutamiento de tokens por room prefix</li>
            <li className="flex items-center gap-2"><span className="text-magenta-500">•</span> Voz Aoede (Google TTS nativo)</li>
            <li className="flex items-center gap-2"><span className="text-magenta-500">•</span> Gestión de reservas conversacional</li>
          </ul>
        </div>

        {/* IT Coach Card */}
        <div className="bg-[#0a0f1d] border border-cyan-500/20 rounded-xl p-8 hover:border-cyan-500/50 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex justify-between items-start mb-4">
            <div className="text-cyan-500 font-mono text-xs uppercase tracking-wider">PWA interactiva con orbe de voz 3D</div>
            <div className="flex items-center gap-2 border border-green-500/30 bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              online
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-4">IT English Coach — Profesora C1/C2</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Profesora de inglés técnico nivel C1/C2 con interfaz PWA. Orbe de voz 3D con @react-three/fiber. Estado global con Zustand. Visualización de audio en tiempo real con VoiceAssistantControlBar de LiveKit.
          </p>

          <div className="text-cyan-500 text-sm font-bold tracking-wider uppercase mb-4">Capacidades</div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2"><span className="text-cyan-500">•</span> Orbe de voz 3D (Three.js / R3F)</li>
            <li className="flex items-center gap-2"><span className="text-cyan-500">•</span> Nivel C1/C2 técnico IT</li>
            <li className="flex items-center gap-2"><span className="text-cyan-500">•</span> Corrección gramatical en tiempo real</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
