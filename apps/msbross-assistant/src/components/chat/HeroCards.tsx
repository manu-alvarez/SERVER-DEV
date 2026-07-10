import { motion } from 'framer-motion';
import { ModelSelector } from './ModelSelector';
import { Wrench, AudioLines } from 'lucide-react';

export function HeroCards() {
  return (
    <div className="flex flex-col items-center md:justify-center min-h-[70vh] w-full px-4 relative z-20 perspective-1000 pb-32">
      
      {/* Dynamic Aura Glow behind Title */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-32 bg-gradient-to-r from-[#00ffcc]/30 via-[#ffcc00]/20 to-[#aa3bff]/30 blur-[80px] -z-10 rounded-full mix-blend-screen animate-pulse pointer-events-none"></div>

      {/* Massive Gradient Title with 3D Pop */}
      <motion.h1 
        initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 1, type: 'spring', bounce: 0.5 }}
        className="text-5xl md:text-9xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00ffcc] to-[#ffcc00] text-center relative inline-block mx-auto"
      >
        MSBrOSs
        <span className="absolute -bottom-2 -right-2 md:-right-8 text-lg md:text-2xl font-bold text-[#ffcc00] uppercase tracking-widest">Nexus</span>
      </motion.h1>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="text-center text-white/60 text-base md:text-lg font-medium max-w-xl mb-20 leading-relaxed"
      >
        <span className="text-white">Plataforma Centralizada de Asistencia Inteligente.</span><br/>
        Integración de IA, herramientas de desarrollo y comunicación por voz.
      </motion.div>

      {/* 3 Cards Grid - Glassmorphism Godmode */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8, type: 'spring', bounce: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full"
      >
        {/* Card 1: Models */}
        <div className="relative group perspective-1000 z-30">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00ffcc] to-transparent rounded-[2rem] blur opacity-20 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative h-full bg-[#11141a]/90 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,255,204,0.1)] flex flex-col items-start justify-between">
            <div className="w-full">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00ffcc]/20 to-transparent flex items-center justify-center mb-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] border border-[#00ffcc]/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <span className="w-5 h-5 rounded-full bg-[#00ffcc] shadow-[0_0_15px_#00ffcc] animate-pulse"></span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Modelos de Lenguaje</h3>
              <p className="text-sm text-white/40 mb-8 leading-relaxed">
                Selecciona entre diferentes proveedores como OpenAI, Anthropic, Google, o modelos locales de Ollama en el servidor.
              </p>
            </div>
            <ModelSelector />
          </div>
        </div>

        {/* Card 2: Tools */}
        <div className="relative group perspective-1000 z-20 cursor-pointer">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ffcc00] to-transparent rounded-[2rem] blur opacity-20 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative h-full bg-[#11141a]/90 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(255,204,0,0.1)]">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ffcc00]/20 to-transparent flex items-center justify-center mb-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] border border-[#ffcc00]/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
              <Wrench className="w-6 h-6 text-[#ffcc00]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Stitch & Tools</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Ejecución de código en tiempo real. Previsualiza React, visualiza componentes y delega tareas en un entorno aislado.
            </p>
          </div>
        </div>

        {/* Card 3: Voice */}
        <div className="relative group perspective-1000 z-10 cursor-pointer">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#aa3bff] to-transparent rounded-[2rem] blur opacity-20 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative h-full bg-[#11141a]/90 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(170,59,255,0.1)]">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#aa3bff]/20 to-transparent flex items-center justify-center mb-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] border border-[#aa3bff]/20 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
              <AudioLines className="w-6 h-6 text-[#aa3bff]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Interacción por Voz</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Comunícate directamente por voz. Respuestas instantáneas y soporte para detección de interrupciones.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
