import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Home() {
  const nodes = [
    { label: 'Nikolina', color: 'bg-magenta-500', glow: 'glow-magenta', angle: 300, radius: 140 },
    { label: 'Perfume', color: 'bg-orange-400', glow: 'glow-orange', angle: 260, radius: 150 },
    { label: 'IT Coach', color: 'bg-magenta-600', glow: 'glow-magenta', angle: 30, radius: 140 },
    { label: 'EliteScout', color: 'bg-cyan-500', glow: 'glow-cyan', angle: 70, radius: 160 },
    { label: 'Mapfre', color: 'bg-yellow-500', glow: 'glow-orange', angle: 110, radius: 130 },
    { label: 'Cuentos', color: 'bg-green-500', glow: 'glow-cyan', angle: 140, radius: 150 },
    { label: 'TaskFlow', color: 'bg-orange-600', glow: 'glow-orange', angle: 200, radius: 160 },
    { label: 'Industrial', color: 'bg-orange-500', glow: 'glow-orange', angle: 230, radius: 140 },
    { label: 'Traductor', color: 'bg-green-400', glow: 'glow-cyan', angle: 170, radius: 140 },
    { label: 'TXA Fitness', color: 'bg-cyan-400', glow: 'glow-cyan', angle: 330, radius: 150 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center justify-between min-h-[calc(100vh-80px)]">
      {/* Left side text */}
      <div className="w-full lg:w-1/2 space-y-8 z-10">
        <div className="font-mono text-cyan-400 text-sm tracking-widest uppercase">
          // Ecosistema de IA en Producción
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
          Ingeniería de IA.<br />
          <span className="text-cyan-400">Microservicios.</span><br />
          Escala Real.
        </h1>

        <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
          MSBrossAI centraliza agentes conversacionales, herramientas SaaS y servicios de infraestructura en un ecosistema digital orquestado y en producción continua.
        </p>

        <div className="grid grid-cols-4 gap-4 py-4">
          <div>
            <div className="text-2xl font-bold text-white">20+</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Apps en producción</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">2</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Agentes IA activos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400">19</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Microservicios</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400">99.9%</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Uptime</div>
          </div>
        </div>

        <Link 
          to="/saas" 
          className="inline-block px-8 py-3 rounded border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all font-medium"
        >
          Explorar Ecosistema &rarr;
        </Link>
      </div>

      {/* Right side nodes visualization */}
      <div className="w-full lg:w-1/2 h-[500px] relative mt-16 lg:mt-0 flex items-center justify-center">
        {/* Center Node */}
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute z-20 w-24 h-24 rounded-full border border-cyan-500/30 bg-[#050811] flex items-center justify-center glow-cyan"
        >
          <div className="w-6 h-6 rounded-full bg-cyan-400" />
          <div className="absolute -bottom-8 text-cyan-400 font-bold tracking-wide">MSBrossAI</div>
        </motion.div>

        {/* Orbiting Nodes */}
        {nodes.map((node, i) => {
          const x = Math.cos((node.angle * Math.PI) / 180) * node.radius;
          const y = Math.sin((node.angle * Math.PI) / 180) * node.radius;

          return (
            <div key={i} className="absolute inset-0 flex items-center justify-center">
              {/* Connection Line */}
              <svg className="absolute w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                <line x1="50%" y1="50%" x2={`calc(50% + ${x}px)`} y2={`calc(50% + ${y}px)`} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              </svg>

              {/* Node Circle */}
              <motion.div 
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ x, y, opacity: 1 }}
                transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
                className={`absolute w-12 h-12 rounded-full border border-white/10 bg-[#050811] flex items-center justify-center z-10 ${node.glow}`}
              >
                <div className={`w-3 h-3 rounded-full ${node.color.replace('bg-', 'bg-').replace('400', '500')}`} style={{ backgroundColor: node.color.includes('magenta') ? '#f0f' : node.color.includes('cyan') ? '#0ff' : node.color.includes('orange') ? '#f90' : '#0f0'}} />
                <div className="absolute -bottom-6 text-xs text-gray-400 whitespace-nowrap">{node.label}</div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
