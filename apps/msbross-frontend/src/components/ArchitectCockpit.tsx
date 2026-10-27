import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  MapPin,
  Briefcase,
  Code2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function ArchitectCockpit() {
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse position normalized (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring physics for smooth realistic movement
  const mouseXSpring = useSpring(x, { stiffness: 240, damping: 24 });
  const mouseYSpring = useSpring(y, { stiffness: 240, damping: 24 });

  // 3D rotations based on spring values
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6.5deg', '-6.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6.5deg', '6.5deg']);

  // Dynamic glare coordinates for subtle glass reflection
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const xPct = clientX / rect.width - 0.5;
    const yPct = clientY / rect.height - 0.5;

    x.set(xPct);
    y.set(yPct);

    setGlare({
      x: (clientX / rect.width) * 100,
      y: (clientY / rect.height) * 100,
      opacity: 0.18,
    });
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div className="relative w-full max-w-[560px] perspective-[1200px] select-none">
      {/* Soft Ambient Glow behind the card */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-indigo-600/10 rounded-3xl blur-[75px] pointer-events-none" />

      {/* 3D Tilted Card Container */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative rounded-3xl p-[1px] bg-gradient-to-b from-cyan-500/30 via-blue-500/15 to-slate-800/40 shadow-2xl shadow-cyan-950/30 transition-shadow duration-300"
      >
        {/* Obsidian Glass Core */}
        <div className="relative rounded-[23px] bg-[#0A1224]/92 backdrop-blur-2xl p-4 sm:p-5 border border-slate-800/80 overflow-hidden">
          {/* Dynamic Specular Glare Reflection */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-30"
            style={{
              opacity: glare.opacity,
              background: `radial-gradient(circle 320px at ${glare.x}% ${glare.y}%, rgba(6, 182, 212, 0.15), transparent 70%)`,
            }}
          />

          {/* Top Bar: Location & Recruiter Status */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800/90 text-xs">
            {/* Location & Modality */}
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <MapPin size={14} className="text-cyan-400 shrink-0" />
              <span>Mequinenza (Zaragoza)</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 text-[11px]">Remoto / Presencial</span>
            </div>

            {/* Availability Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Disponible para incorporación
            </div>
          </div>

          {/* Main Body: 2 Columns Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Column A: Real Portrait Sanctuary */}
            <div className="sm:col-span-5 relative group">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-950 to-black shadow-lg shadow-black/50 aspect-[4/5] flex items-center justify-center">
                {/* Real Photo without hard circular background */}
                <img
                  src="./hero-portrait.png"
                  alt="Manuel Álvarez — Técnico en Sistemas y Desarrollador"
                  className="w-full h-full object-contain filter contrast-105 group-hover:scale-[1.02] transition-transform duration-500 select-none pointer-events-none"
                />

                {/* Subtle bottom shadow vignette for name overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

                {/* Floating Recruiter-Focused Badge on the photo */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/70 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <span>Manuel Álvarez</span>
                    <CheckCircle2 size={13} className="text-cyan-400 shrink-0" />
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium mt-0.5">
                    Técnico de Sistemas & Dev
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    En búsqueda activa de empleo
                  </div>
                </div>
              </div>
            </div>

            {/* Column B: Professional Value & Strengths for Recruiters */}
            <div className="sm:col-span-7 space-y-2.5">
              {/* Block 1: Systems & IT Support */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
                    <Briefcase size={13} />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    Sistemas & Soporte IT (SMR)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Administración Linux/Windows, redes, despliegue de servidores y soporte a usuarios.
                </p>
              </div>

              {/* Block 2: Web Dev & AI Tools */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-md bg-blue-500/10 text-blue-400">
                    <Code2 size={13} />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    Desarrollo Web & Soluciones IA
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Interfaces modernas con React/TypeScript, APIs en Python/FastAPI y automatización.
                </p>
              </div>

              {/* Block 3: Attitude & Continuous Learning */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-amber-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-md bg-amber-500/10 text-amber-400">
                    <Sparkles size={13} />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    Compromiso & Aprendizaje
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Resolutivo, constante y con alta motivación por integrarme y sumar valor al equipo.
                </p>
              </div>

              {/* Block 4: Key ATS/Recruiter Filter Chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[
                  'macOS / Linux / Windows',
                  'SMR & Redes',
                  'Docker',
                  'TypeScript',
                  'Python',
                  'Soporte IT',
                ].map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-md bg-slate-800/70 border border-slate-700/60 text-[10px] font-medium text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
