import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Server, Cpu, Activity, Terminal, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';

export default function ArchitectCockpit() {
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse position normalized (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring physics for ultra-smooth realistic movement
  const mouseXSpring = useSpring(x, { stiffness: 240, damping: 24 });
  const mouseYSpring = useSpring(y, { stiffness: 240, damping: 24 });

  // 3D rotations based on spring values
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7deg', '7deg']);

  // Dynamic glare coordinates for realistic glass reflection
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
      opacity: 0.22,
    });
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div className="relative w-full max-w-[540px] perspective-[1200px] select-none">
      {/* Cinematic Ambient Glow behind the card */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/20 via-blue-600/15 to-purple-600/15 rounded-3xl blur-[80px] pointer-events-none" />

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
        className="relative rounded-3xl p-[1px] bg-gradient-to-b from-cyan-500/35 via-blue-500/20 to-slate-800/40 shadow-2xl shadow-cyan-950/40 transition-shadow duration-300"
      >
        {/* Obsidian Glass Core */}
        <div className="relative rounded-[23px] bg-[#0A1224]/90 backdrop-blur-2xl p-4 sm:p-5 border border-slate-800/80 overflow-hidden">
          {/* Dynamic Specular Glare Reflection */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-30"
            style={{
              opacity: glare.opacity,
              background: `radial-gradient(circle 320px at ${glare.x}% ${glare.y}%, rgba(6, 182, 212, 0.2), transparent 70%)`,
            }}
          />

          {/* Top Bar: Terminal HUD & Node Telemetry */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800/90 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <Terminal size={14} className="text-cyan-400" />
              <span className="text-slate-400 font-medium">sys.node:</span>
              <span className="text-cyan-300 font-semibold tracking-wide">msbross-vps</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Online pulse */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                ONLINE
              </div>

              {/* Latency chip */}
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
                <Activity size={12} className="text-cyan-400 animate-pulse" />
                <span>18ms</span>
              </div>
            </div>
          </div>

          {/* Main Cockpit Body: 2 Columns Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Column A: Manuel's Real Portrait Sanctum */}
            <div className="sm:col-span-5 relative group">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-lg shadow-black/50 aspect-[4/5] flex items-center justify-center">
                {/* Real High-Contrast Portrait */}
                <img
                  src="./profile-photo.png"
                  alt="Manuel Álvarez — Lead Systems & AI Developer"
                  className="w-full h-full object-cover object-center filter contrast-105 brightness-100 group-hover:scale-[1.02] transition-transform duration-500"
                />

                {/* Subtle bottom shadow vignette for name overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

                {/* Floating Verified Badge on the photo */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 p-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/70 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <span>Manuel Álvarez</span>
                    <CheckCircle2 size={13} className="text-cyan-400 shrink-0" />
                  </div>
                  <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
                    Lead Systems & AI
                  </div>
                </div>
              </div>
            </div>

            {/* Column B: Real-Time Telemetry & Systems Deck */}
            <div className="sm:col-span-7 space-y-2.5">
              {/* Telemetry Block 1: Systems & Cloud */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
                    <Server size={13} />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    Infraestructura & Cloud
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Linux · Docker · PM2 · Traefik v3
                </div>
              </div>

              {/* Telemetry Block 2: AI & WebRTC Agents */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded-md bg-blue-500/10 text-blue-400">
                    <Cpu size={13} />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    Agentes IA & Voz en Vivo
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  LiveKit WebRTC · Ollama · LiteLLM
                </div>
              </div>

              {/* Telemetry Block 3: Metrics & Microservices Status */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/90">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Zap size={12} className="text-amber-400" />
                    20+ Microservicios
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                    100% Operativo
                  </span>
                </div>

                {/* Animated status bars */}
                <div className="flex gap-1 h-1.5 w-full mt-2">
                  <div className="h-full flex-1 bg-cyan-400 rounded-full" />
                  <div className="h-full flex-1 bg-cyan-400 rounded-full" />
                  <div className="h-full flex-1 bg-blue-500 rounded-full" />
                  <div className="h-full flex-1 bg-blue-500 rounded-full" />
                  <div className="h-full flex-1 bg-emerald-400 rounded-full animate-pulse" />
                </div>
              </div>

              {/* Telemetry Block 4: Quick Tech Badges */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {['TypeScript', 'FastAPI', 'Docker', 'PostgreSQL', 'Tailscale'].map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[10px] font-mono text-slate-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Security & Uptime Footer */}
          <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>SSL A+ / HSTS Let's Encrypt</span>
            </div>
            <div className="text-slate-400">Uptime 99.98%</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
