import { useState } from 'react';
import { motion } from 'framer-motion';

interface MenuGridProps {
  menuItems: any[];
}

export function MenuGrid({ menuItems }: MenuGridProps) {
  const [filter, setFilter] = useState('Todos');
  const categories = ['Todos', ...Array.from(new Set(menuItems.map(m => m.category)))];
  
  const filteredItems = filter === 'Todos' ? menuItems : menuItems.filter(m => m.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif text-cyan-400 font-bold tracking-tight">🍽️ Carta Digital</h2>
        
        <div className="flex gap-2 bg-[#050b14]/50 p-1.5 rounded-full border border-white/5 backdrop-blur-md">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === c 
                  ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {filteredItems.map(item => (
          <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            key={item.id} 
            className="group relative bg-[#0a1520]/80 backdrop-blur-xl border border-cyan-500/10 rounded-2xl overflow-hidden hover:border-cyan-400/50 transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] glitch-hover-effect"
          >
            {item.image_url && (
              <div className="h-48 overflow-hidden relative bg-black/40">
                <img 
                  src={`/app/livekit-nikolina${item.image_url}`} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1520]/90 to-transparent"></div>
              </div>
            )}
            <div className="p-5 flex flex-col h-full relative z-10">
              <div className="flex justify-between items-start gap-3 mb-2">
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">{item.name}</h3>
                <span className="text-cyan-400 font-bold text-lg">{item.price}€</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-4 flex-grow">{item.description}</p>
              
              {item.allergens && (
                <div className="flex flex-wrap gap-1.5 mt-auto pt-4 border-t border-white/5">
                  {item.allergens.split(',').map((allergen: string) => (
                    <span key={allergen} className="text-[10px] font-mono px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 uppercase tracking-widest">
                      ⚠️ {allergen.trim() || 'Alérgenos'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
