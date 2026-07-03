import { Server, Shield, Network, Lock, Zap, HardDrive, Globe, Box } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

export default function Architecture() {
  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVars: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  };

  return (
    <div className="space-y-10 min-h-[85vh] py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-cyan-950/40 border border-cyan-500/30"
          >
            <Server className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Resumen Técnico</span>
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="text-white">Arquitectura del </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">
              Servidor
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl leading-relaxed">
            Servidor VPS (Contabo). Proxy Inverso Traefik v3. Docker Compose para el despliegue de contenedores. Let's Encrypt para certificados TLS/SSL automatizados. Cada servicio expuesto mediante su propio subdominio.
          </p>
        </div>
      </div>

      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { value: '20+', label: 'Contenedores Docker', color: 'from-cyan-400 to-blue-500' },
          { value: '1', label: 'Proxy Traefik v3', color: 'from-blue-400 to-indigo-500' },
          { value: '1', label: 'Servidor VPS', color: 'from-indigo-400 to-purple-500' },
          { value: '24/7', label: 'Monitorizado', color: 'from-emerald-400 to-teal-500' }
        ].map((stat, idx) => (
          <motion.div key={idx} variants={itemVars} className="bg-[#0A101C]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full blur-[60px] opacity-10 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none`}></div>
            <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 mb-2">
              {stat.value}
            </div>
            <div className="text-xs text-gray-500 font-mono uppercase tracking-widest">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12"
      >
        <motion.div variants={itemVars} className="lg:col-span-3 bg-[#0A101C]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-500/30 backdrop-blur-xl">
              <Network className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-mono uppercase text-cyan-400 mb-2 tracking-wider">Enrutador Principal</div>
              <h2 className="text-3xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-500 transition-all">
                Traefik v3 — Proxy Inverso
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-4xl">
                Funciona como un proxy inverso y enrutador principal. Utiliza la integración nativa con Docker para detectar nuevos contenedores y generar automáticamente los certificados SSL de Let's Encrypt, sirviendo el tráfico por HTTPS de forma segura y sin configuración manual.
              </p>
            </div>
          </div>
        </motion.div>

        {[
          { 
            title: 'Gestión de Secretos', 
            desc: 'Variables de entorno inyectadas de forma segura a través de archivos .env y Docker Compose. Claves maestras nunca son expuestas al frontal.', 
            icon: Lock,
            color: 'text-rose-400', 
            bg: 'bg-rose-500/10' 
          },
          { 
            title: 'Aislamiento de Red', 
            desc: 'Microservicios conectados en redes internas virtuales de Docker. Solo Traefik tiene los puertos públicos 80 y 443 expuestos al mundo.', 
            icon: Shield,
            color: 'text-indigo-400', 
            bg: 'bg-indigo-500/10' 
          },
          { 
            title: 'CORS Estricto', 
            desc: 'Bloquea solicitudes de origen cruzado no autorizadas en todos los backends (FastAPI, Express, Next.js) mediante whitelist estricta.', 
            icon: Zap,
            color: 'text-amber-400', 
            bg: 'bg-amber-500/10' 
          },
          { 
            title: 'Contenerización', 
            desc: 'Cada aplicación, base de datos y bot está encapsulado individualmente en un contenedor Docker con dependencias aisladas.', 
            icon: Box,
            color: 'text-blue-400', 
            bg: 'bg-blue-500/10' 
          },
          { 
            title: 'Base de Datos Segura', 
            desc: 'Bases de datos (PostgreSQL, Supabase) no expuestas a la web externa, accesibles únicamente por los microservicios internos autorizados.', 
            icon: HardDrive,
            color: 'text-emerald-400', 
            bg: 'bg-emerald-500/10' 
          },
          { 
            title: 'Dominio Global', 
            desc: 'Despliegues en subdominios automatizados bajo la arquitectura DNS de manuelalvarez.dev (Ej: combipro.manuelalvarez.dev, elitescout.manuelalvarez.dev...).', 
            icon: Globe,
            color: 'text-purple-400', 
            bg: 'bg-purple-500/10' 
          }
        ].map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div key={idx} variants={itemVars} className="bg-[#0A101C]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 group hover:-translate-y-2 transition-transform duration-500 hover:border-white/20">
              <div className={`p-4 rounded-xl ${feature.bg} w-max mb-6 group-hover:scale-110 transition-transform duration-500`}>
                <Icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-white/80 transition-colors">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
