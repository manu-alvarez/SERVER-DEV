import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const nodes = [
  { id: 'nikolina', label: 'Nikolina', color: '#ec4899', angle: -60, delay: 0.1 },
  { id: 'perfume', label: 'Perfume', color: '#f59e0b', angle: -90, delay: 0.2 },
  { id: 'itcoach', label: 'IT Coach', color: '#ec4899', angle: -30, delay: 0.3 },
  { id: 'elitescout', label: 'EliteScout', color: '#06b6d4', angle: 0, delay: 0.4 },
  { id: 'mapfre', label: 'Mapfre', color: '#f59e0b', angle: 30, delay: 0.5 },
  { id: 'cuentos', label: 'Cuentos', color: '#10b981', angle: 60, delay: 0.6 },
  { id: 'taskflow', label: 'TaskFlow', color: '#ea580c', angle: 90, delay: 0.7 },
  { id: 'industrial', label: 'Industrial', color: '#ea580c', angle: 120, delay: 0.8 },
  { id: 'traductor', label: 'Traductor', color: '#10b981', angle: 150, delay: 0.9 },
  { id: 'txafitness', label: 'TXA Fitness', color: '#06b6d4', angle: 180, delay: 1.0 },
];

export default function Home() {
  return (
    <div className="min-h-[85vh] flex items-center justify-between gap-12">
      {/* Left Column: Typography */}
      <div className="w-1/2 space-y-6">
        <div className="font-mono text-cyan-400 text-sm mb-4">
          // Ecosistema de IA en Producción
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
          <span className="text-white block">Ingeniería de IA.</span>
          <span className="text-cyan-400 block drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            Microservicios.
          </span>
          <span className="text-white block">Escala Real.</span>
        </h1>

        <p className="text-gray-400 text-lg lg:text-xl max-w-xl leading-relaxed mt-6">
          MSBrossAI centraliza agentes conversacionales, herramientas SaaS y servicios de infraestructura en un ecosistema digital orquestado y en producción continua.
        </p>

        <div className="flex gap-8 pt-6">
          <div>
            <div className="text-3xl font-bold text-cyan-400">20+</div>
            <div className="text-xs text-gray-500 font-mono uppercase tracking-wider mt-1">Apps en producción</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-magenta-400">2</div>
            <div className="text-xs text-gray-500 font-mono uppercase tracking-wider mt-1">Agentes IA activos</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-cyan-400">19</div>
            <div className="text-xs text-gray-500 font-mono uppercase tracking-wider mt-1">Microservicios</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-400">99.9%</div>
            <div className="text-xs text-gray-500 font-mono uppercase tracking-wider mt-1">Uptime</div>
          </div>
        </div>

        <div className="pt-8">
          <button className="group flex items-center gap-3 bg-transparent border border-cyan-500/50 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 px-6 py-3 rounded-lg font-mono text-sm transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] bg-[#050B14]">
            Explorar Ecosistema 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Right Column: Node Graph */}
      <div className="w-1/2 relative h-[600px] flex items-center justify-center">
        {/* Center Node */}
        <motion.div 
          className="relative z-10 flex flex-col items-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="w-24 h-24 rounded-full border-2 border-cyan-400 flex items-center justify-center bg-[#050B14] shadow-[0_0_50px_rgba(6,182,212,0.6)] relative group cursor-pointer">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-ping opacity-75"></div>
            <div className="w-8 h-8 bg-cyan-400 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.8)]"></div>
          </div>
          <div className="mt-3 text-cyan-400 font-bold text-xl tracking-wider drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
            MSBrossAI
          </div>
        </motion.div>

        {/* Satellites */}
        {nodes.map((node) => {
          const radius = 220;
          const rad = (node.angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;

          return (
            <React.Fragment key={node.id}>
              {/* Connecting Line */}
              <motion.svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: node.delay + 0.5 }}
              >
                <line 
                  x1="50%" 
                  y1="50%" 
                  x2={`calc(50% + ${x}px)`} 
                  y2={`calc(50% + ${y}px)`} 
                  stroke={node.color}
                  strokeWidth="1"
                  strokeOpacity="0.4"
                  style={{ filter: `drop-shadow(0 0 5px ${node.color})` }}
                />
              </motion.svg>

              {/* Satellite Node */}
              <motion.div
                className="absolute z-10 flex flex-col items-center"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)'
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: node.delay, type: 'spring' }}
              >
                <div 
                  className="w-12 h-12 rounded-full border-2 flex items-center justify-center bg-[#050B14] cursor-pointer hover:scale-110 transition-transform"
                  style={{ 
                    borderColor: node.color,
                    boxShadow: `0 0 20px ${node.color}66`
                  }}
                >
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ 
                      backgroundColor: node.color,
                      boxShadow: `0 0 10px ${node.color}`
                    }}
                  ></div>
                </div>
                <div className="mt-2 text-sm text-gray-300 font-medium tracking-wide whitespace-nowrap">
                  {node.label}
                </div>
              </motion.div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
