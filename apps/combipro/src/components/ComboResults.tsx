import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft } from 'lucide-react';
import { Combo } from '../types';

interface Props {
  combos: Combo[];
}

export default function ComboResults({ combos }: Props) {
  if (combos.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, height: 0 }} 
        animate={{ opacity: 1, height: 'auto' }} 
        exit={{ opacity: 0, height: 0 }} 
        className="mb-16"
      >
        <h2 className="font-display text-gradient text-3xl font-black mb-8 flex items-center gap-4">
          Tickets Algorítmicos
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {combos.map((combo, i) => (
            <motion.div 
              key={combo.id} 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: i * 0.15 }} 
              className="portal-card"
            >
              <div className="portal-card-inner overflow-hidden flex flex-col">
                <div className="bg-white/5 p-6 border-b border-border flex justify-between items-center">
                  <div>
                    <div className="font-display text-gradient text-xl font-black">TICKET #{i + 1}</div>
                    <div className="text-sm text-muted-foreground mt-1 font-semibold">
                      {combo.picks.length} picks · Nivel {combo.riskLevel.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground tracking-wider font-bold">
                      Cuota <span className="font-display text-2xl text-white font-black ml-2">{combo.totalOdds.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-emerald-400 tracking-wider mt-1 font-bold">
                      Win <span className="font-display text-lg font-black ml-2">{combo.potentialWin.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col gap-4 flex-1">
                  {combo.picks.map((pick, j) => (
                    <div key={j} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                      <div>
                        <div className="text-xs text-brand-400 font-bold tracking-wider mb-1">{pick.league}</div>
                        <div className="text-sm font-semibold">{pick.match}</div>
                        <div className="text-xs text-muted-foreground mt-1 font-semibold flex items-center">
                          {pick.type} <ArrowRightLeft size={10} className="mx-2 inline" /> <span className="text-white font-bold">{pick.selection}</span>
                        </div>
                      </div>
                      <div className="font-display text-lg font-black text-brand-400 bg-brand-500/10 px-3 py-1.5 rounded-lg">
                        {pick.odds.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
