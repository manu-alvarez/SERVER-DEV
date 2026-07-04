import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useComboStore } from '../store/comboStore';
import { cn } from '../utils/cn';

export default function HistoryPanel() {
  const { history, updateHistoryStatus, clearHistory } = useComboStore();

  const totalCombos = history.length;
  const resolvedCombos = history.filter(c => c.status !== 'pending');
  const wonCombos = history.filter(c => c.status === 'won');
  
  const winRate = resolvedCombos.length > 0 
    ? Math.round((wonCombos.length / resolvedCombos.length) * 100) 
    : 0;

  const totalStaked = history.reduce((acc, c) => acc + c.stake, 0);
  const totalWon = history.reduce((acc, c) => c.status === 'won' ? acc + c.potentialWin : acc, 0);
  const totalLost = history.reduce((acc, c) => c.status === 'lost' ? acc + c.stake : acc, 0);
  
  const resolvedStaked = resolvedCombos.reduce((acc, c) => acc + c.stake, 0);
  const roi = resolvedStaked > 0 
    ? (((totalWon - resolvedStaked) / resolvedStaked) * 100).toFixed(1) 
    : 0;

  const netProfit = totalWon - resolvedStaked;

  const handleClear = () => {
    if (confirm('¿Estás seguro de que quieres limpiar todo el historial?')) {
      clearHistory();
    }
  };

  if (history.length === 0) return null;

  return (
    <div className="mt-16 mb-16">
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-display text-gradient text-3xl font-black">
          Historial y Rendimiento
        </h2>
        <button 
          onClick={handleClear}
          className="bg-transparent border border-destructive text-destructive px-4 py-2 rounded-lg cursor-pointer text-sm font-semibold hover:bg-destructive/10 transition-colors"
        >
          Limpiar Historial
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="portal-card">
          <div className="portal-card-inner p-6 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-bold">Acierto</div>
            <div className={cn("font-display text-4xl font-black mb-1", winRate >= 50 ? 'text-emerald-400' : 'text-rose-500')}>
              {winRate}%
            </div>
            <div className="text-xs text-muted-foreground">{wonCombos.length} de {resolvedCombos.length} resueltas</div>
          </div>
        </div>
        
        <div className="portal-card">
          <div className="portal-card-inner p-6 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-bold">Beneficio Neto</div>
            <div className={cn("font-display text-4xl font-black mb-1", netProfit >= 0 ? 'text-emerald-400' : 'text-rose-500')}>
              {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)}€
            </div>
            <div className="text-xs text-muted-foreground">En apuestas resueltas</div>
          </div>
        </div>

        <div className="portal-card">
          <div className="portal-card-inner p-6 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-bold">ROI (Retorno)</div>
            <div className={cn("font-display text-4xl font-black mb-1", Number(roi) >= 0 ? 'text-emerald-400' : 'text-rose-500')}>
              {Number(roi) >= 0 ? '+' : ''}{roi}%
            </div>
            <div className="text-xs text-muted-foreground">Sobre {resolvedStaked}€ invertidos</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {history.map((combo, i) => (
            <motion.div 
              key={combo.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="portal-card"
            >
              <div className="portal-card-inner overflow-hidden flex flex-col h-full">
                <div className={cn(
                  "p-4 border-b border-border flex justify-between items-center transition-colors duration-300",
                  combo.status === 'won' ? 'bg-emerald-500/10 border-emerald-500/30' : 
                  combo.status === 'lost' ? 'bg-rose-500/10 border-rose-500/30' : 
                  'bg-white/5'
                )}>
                  <div>
                    <div className="font-display text-gradient text-lg font-black">
                      {new Date(combo.date).toLocaleDateString()} - {new Date(combo.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-semibold">
                      {combo.picks.length} picks · Nivel {combo.riskLevel.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground tracking-wider font-semibold">
                      Cuota <span className="font-display text-xl text-white font-black ml-1">{combo.totalOdds.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground tracking-wider mt-1 font-semibold">
                      Stake <span className="text-white ml-1">{combo.stake}€</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
                  {combo.picks.map((pick, j) => (
                    <div key={j} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                      <div>
                        <div className="text-xs font-semibold text-white/90">{pick.match}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 flex items-center font-semibold">
                          {pick.type} <ArrowRightLeft size={10} className="mx-1" /> <span className="text-white">{pick.selection}</span>
                        </div>
                      </div>
                      <div className="font-display text-sm font-black text-brand-400 bg-brand-500/10 px-2 py-1 rounded-md">
                        {pick.odds.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-black/60 border-t border-border flex justify-between items-center mt-auto">
                  <div className={cn(
                    "font-display text-lg font-black",
                    combo.status === 'won' ? 'text-emerald-400' : 
                    combo.status === 'lost' ? 'text-rose-500' : 'text-white'
                  )}>
                    Potencial: {combo.potentialWin.toFixed(2)}€
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateHistoryStatus(combo.id, 'won')}
                      className={cn(
                        "p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer",
                        combo.status === 'won' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-emerald-500 hover:bg-emerald-500/20'
                      )}
                      title="Marcar como Ganada"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button 
                      onClick={() => updateHistoryStatus(combo.id, 'lost')}
                      className={cn(
                        "p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer",
                        combo.status === 'lost' ? 'bg-rose-500 text-white' : 'bg-white/5 text-rose-500 hover:bg-rose-500/20'
                      )}
                      title="Marcar como Perdida"
                    >
                      <XCircle size={18} />
                    </button>
                    <button 
                      onClick={() => updateHistoryStatus(combo.id, 'pending')}
                      className={cn(
                        "p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer",
                        combo.status === 'pending' ? 'bg-yellow-500 text-black' : 'bg-white/5 text-yellow-500 hover:bg-yellow-500/20'
                      )}
                      title="Marcar como Pendiente"
                    >
                      <Clock size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
