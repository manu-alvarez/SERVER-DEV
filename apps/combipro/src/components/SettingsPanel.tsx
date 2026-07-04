import React from 'react';
import { motion } from 'framer-motion';
import { useComboStore } from '../store/comboStore';
import { LEAGUES, MARKETS, RISKS, RISK_DESCRIPTIONS } from '../constants';
import { cn } from '../utils/cn';

const itemVariants = { 
  hidden: { opacity: 0, y: 20 }, 
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } 
};

export default function SettingsPanel() {
  const { 
    selectedLeagues, toggleLeague,
    selectedMarket, setSelectedMarket,
    risk, setRisk,
    stake, setStake
  } = useComboStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* Leagues Filter */}
      <motion.div variants={itemVariants} className="portal-card flex flex-col h-full">
        <div className="portal-card-inner p-6 flex flex-col">
          <h3 className="font-display text-sm text-muted-foreground uppercase tracking-[2px] mb-6 font-bold">
            Filtro de Competiciones
          </h3>
          <div className="grid grid-cols-2 gap-2 flex-1">
            {LEAGUES.map(league => {
              const active = selectedLeagues.includes(league.key);
              const Icon = league.icon;
              return (
                <button 
                  key={league.key} 
                  onClick={() => toggleLeague(league.key)}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer",
                    active 
                      ? `bg-white/10 border-white/20 ${league.color}` 
                      : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
                  )}
                >
                  <Icon size={14} /> <span className="truncate">{league.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Markets */}
      <motion.div variants={itemVariants} className="portal-card flex flex-col h-full">
        <div className="portal-card-inner p-6 flex flex-col">
          <h3 className="font-display text-sm text-muted-foreground uppercase tracking-[2px] mb-6 font-bold">
            Mercados a Combinar
          </h3>
          <div className="grid grid-cols-1 gap-2 flex-1">
            {MARKETS.map(market => {
              const active = selectedMarket === market.key;
              const Icon = market.icon;
              return (
                <button 
                  key={market.key} 
                  onClick={() => setSelectedMarket(market.key)} 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all duration-200 border cursor-pointer",
                    active 
                      ? "bg-brand-500/15 border-brand-500 text-white" 
                      : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
                  )}
                >
                  <Icon size={18} className={active ? 'text-brand-500' : 'text-muted-foreground'} /> 
                  {market.label}
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Risk & Stake */}
      <motion.div variants={itemVariants} className="portal-card flex flex-col h-full justify-between">
        <div className="portal-card-inner p-6 flex flex-col justify-between h-full">
          <div>
            <h3 className="font-display text-sm text-muted-foreground uppercase tracking-[2px] mb-6 font-bold">
              Perfil de Riesgo
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {RISKS.map(r => {
                const active = risk === r.key;
                const Icon = r.icon;
                return (
                  <button 
                    key={r.key} 
                    onClick={() => setRisk(r.key as any)} 
                    className={cn(
                      "flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border cursor-pointer",
                      active 
                        ? "bg-white/10 border-white/10 text-white" 
                        : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
                    )}
                  >
                    <Icon size={16} className={active ? r.color : 'text-muted-foreground'} /> 
                    {r.label}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5">
              <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                {RISK_DESCRIPTIONS[risk]}
              </p>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Stake Inicial</span>
              <span className="font-display font-black text-xl text-brand-400">{stake}€</span>
            </div>
            <input 
              type="range" 
              value={stake} 
              onChange={e => setStake(Number(e.target.value))} 
              min={5} 
              max={500} 
              step={5} 
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
