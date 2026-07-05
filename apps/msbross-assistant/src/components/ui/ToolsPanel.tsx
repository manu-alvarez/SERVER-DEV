import { motion } from 'framer-motion';
import { useChatStore } from '../../store/useChatStore';
import { Button } from './Button';
import { X, Search, FileCode2, TerminalSquare, Calculator, Database } from 'lucide-react';

const tools = [
  { id: 'web', name: 'Web Search', icon: Search, desc: 'Búsqueda de información en tiempo real.', active: true },
  { id: 'code', name: 'Code Interpreter', icon: TerminalSquare, desc: 'Ejecución de código en sandbox.', active: true },
  { id: 'file', name: 'File Reader', icon: FileCode2, desc: 'Lectura de archivos y documentos.', active: true },
  { id: 'calc', name: 'Calculator', icon: Calculator, desc: 'Operaciones matemáticas precisas.', active: true },
  { id: 'db', name: 'Database Query', icon: Database, desc: 'Consultas a bases de datos SQL.', active: true },
];

/**
 * Sliding Tools Panel. Managed via AnimatePresence in App.tsx:
 * - Mounted only when isToolsOpen === true
 * - Uses initial/animate/exit for proper slide-in/out animation
 */
export function ToolsPanel() {
  const { setIsToolsOpen } = useChatStore();

  return (
    <>
      {/* Backdrop overlay (mobile) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsToolsOpen(false)}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      />

      {/* Sliding Panel */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-16 left-0 bottom-0 w-80 max-w-[85vw] bg-[#0f1115]/95 backdrop-blur-xl border-r border-white/10 shadow-[20px_0_50px_rgba(0,0,0,0.5)] z-50 flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ffcc00] animate-pulse"></span>
            Agent Tools
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setIsToolsOpen(false)}>
            <X className="w-5 h-5 text-white/50 hover:text-white" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-4">Capacidades del Sistema</p>
          
          {tools.map((tool) => (
            <div 
              key={tool.id} 
              className={`p-3 rounded-xl border transition-all ${
                tool.active 
                  ? 'bg-white/5 border-white/10 hover:border-[#ffcc00]/50 hover:bg-[#ffcc00]/5' 
                  : 'bg-black/20 border-transparent opacity-50 grayscale'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <tool.icon className={`w-4 h-4 ${tool.active ? 'text-[#ffcc00]' : 'text-white/30'}`} />
                  <h3 className="font-semibold text-sm text-white/90">{tool.name}</h3>
                </div>
                {tool.active && (
                  <div className="w-8 h-4 bg-[#ffcc00]/20 rounded-full flex items-center p-0.5 border border-[#ffcc00]/30 shadow-[0_0_10px_rgba(255,204,0,0.2)]">
                    <div className="w-3 h-3 bg-[#ffcc00] rounded-full translate-x-4 shadow-[0_0_5px_#ffcc00]"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-white/50 leading-relaxed">{tool.desc}</p>
            </div>
          ))}
          
        </div>
        
        <div className="p-4 border-t border-white/5 bg-black/20">
          <p className="text-[10px] text-white/30 text-center uppercase tracking-wider">
            Integración de herramientas nativas.<br/>MSBrOSs Kernel v9.2
          </p>
        </div>
      </motion.div>
    </>
  );
}
