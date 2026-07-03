import { memo } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface StreamApp {
  name: string;
  icon: LucideIcon;
  tag: string;
  color: string;
}

interface InfiniteStreamProps {
  col1: StreamApp[];
  col2: StreamApp[];
}

/**
 * Renders the dual infinite scrolling columns.
 * Extracted and memoized to prevent re-renders in the main layout.
 */
export const InfiniteStream = memo(({ col1, col2 }: InfiniteStreamProps) => {
  return (
    <div className="w-full lg:w-1/2 relative h-[700px] flex items-center justify-center overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
      <div className="flex gap-4 md:gap-6 relative w-full justify-center rotate-[-5deg] scale-[0.6] sm:scale-75 md:scale-100 lg:scale-110">
        
        {/* Column 1 (Scrolls UP) */}
        <motion.div 
          className="flex flex-col gap-6"
          animate={{ y: ["0%", "-50%"] }}
          transition={{ duration: 25, ease: "linear", repeat: Infinity }}
          style={{ willChange: 'transform' }}
        >
          {col1.map((app, i) => {
            const Icon = app.icon;
            return (
              <div key={`col1-${i}`} className="w-56 md:w-64 p-4 md:p-5 rounded-2xl bg-[#0A101C]/90 backdrop-blur-md border border-white/10 shadow-xl flex flex-col gap-4 group hover:border-cyan-500/50 transition-colors">
                <div className="flex justify-between items-center">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${app.color} bg-opacity-20`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[9px] font-mono text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">
                    {app.tag}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-none">{app.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-mono text-gray-500">SYS_ONLINE</span>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Column 2 (Scrolls DOWN) */}
        <motion.div 
          className="flex flex-col gap-6"
          animate={{ y: ["-50%", "0%"] }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          style={{ willChange: 'transform' }}
        >
          {col2.map((app, i) => {
            const Icon = app.icon;
            return (
              <div key={`col2-${i}`} className="w-56 md:w-64 p-4 md:p-5 rounded-2xl bg-[#0A101C]/90 backdrop-blur-md border border-white/10 shadow-xl flex flex-col gap-4 group hover:border-purple-500/50 transition-colors">
                <div className="flex justify-between items-center">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${app.color} bg-opacity-20`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[9px] font-mono text-magenta-400 border border-magenta-500/20 px-2 py-0.5 rounded-full uppercase">
                    {app.tag}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-none">{app.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-mono text-gray-500">SYS_ONLINE</span>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
});

InfiniteStream.displayName = 'InfiniteStream';
