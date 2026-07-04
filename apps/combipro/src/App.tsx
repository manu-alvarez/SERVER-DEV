import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Lock, RefreshCw, XCircle } from 'lucide-react';
import { useComboStore } from './store/comboStore';
import { useOddsApi } from './hooks/useOddsApi';
import SettingsPanel from './components/SettingsPanel';
import ComboResults from './components/ComboResults';
import HistoryPanel from './components/HistoryPanel';
import { Match, Pick, Combo } from './types';

function calcProb(odds: number): number { return Math.round((1 / (odds * 1.05)) * 100); }

function playGenerateSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

function generateAlgorithmicCombos(matches: Match[], risk: 'safe' | 'balanced' | 'turbo', stake: number, marketFilter: string): Combo[] {
  const allPicks: Pick[] = [];
  matches.forEach(m => {
    allPicks.push(
      { matchId: m.id, match: `${m.homeTeam} vs ${m.awayTeam}`, league: m.leagueName, type: '1X2', selection: '1', odds: m.odds.home, probability: calcProb(m.odds.home) },
      { matchId: m.id, match: `${m.homeTeam} vs ${m.awayTeam}`, league: m.leagueName, type: '1X2', selection: 'X', odds: m.odds.draw, probability: calcProb(m.odds.draw) },
      { matchId: m.id, match: `${m.homeTeam} vs ${m.awayTeam}`, league: m.leagueName, type: '1X2', selection: '2', odds: m.odds.away, probability: calcProb(m.odds.away) },
      { matchId: m.id, match: `${m.homeTeam} vs ${m.awayTeam}`, league: m.leagueName, type: 'Goles', selection: '+2.5', odds: m.odds.over25, probability: calcProb(m.odds.over25) },
      { matchId: m.id, match: `${m.homeTeam} vs ${m.awayTeam}`, league: m.leagueName, type: 'Goles', selection: '-2.5', odds: m.odds.under25, probability: calcProb(m.odds.under25) },
      { matchId: m.id, match: `${m.homeTeam} vs ${m.awayTeam}`, league: m.leagueName, type: 'Doble Oport.', selection: '1X', odds: m.odds.dc1x, probability: calcProb(m.odds.dc1x) },
      { matchId: m.id, match: `${m.homeTeam} vs ${m.awayTeam}`, league: m.leagueName, type: 'Doble Oport.', selection: 'X2', odds: m.odds.dcx2, probability: calcProb(m.odds.dcx2) },
      { matchId: m.id, match: `${m.homeTeam} vs ${m.awayTeam}`, league: m.leagueName, type: 'Doble Oport.', selection: '12', odds: m.odds.dc12, probability: calcProb(m.odds.dc12) },
      { matchId: m.id, match: `${m.homeTeam} vs ${m.awayTeam}`, league: m.leagueName, type: 'Sin Empate', selection: '1', odds: m.odds.dnbHome, probability: calcProb(m.odds.dnbHome) },
      { matchId: m.id, match: `${m.homeTeam} vs ${m.awayTeam}`, league: m.leagueName, type: 'Sin Empate', selection: '2', odds: m.odds.dnbAway, probability: calcProb(m.odds.dnbAway) }
    );
  });

  let allowedTypes: string[] = [];
  if (marketFilter === 'auto') allowedTypes = ['1X2', 'Goles', 'Doble Oport.', 'Sin Empate'];
  else if (marketFilter === '1x2') allowedTypes = ['1X2'];
  else if (marketFilter === 'goals') allowedTypes = ['Goles'];
  else if (marketFilter === 'dc') allowedTypes = ['Doble Oport.'];
  else if (marketFilter === 'dnb') allowedTypes = ['Sin Empate'];

  const filteredByMarket = allPicks.filter(p => allowedTypes.includes(p.type));
  const minProb = risk === 'safe' ? 60 : risk === 'balanced' ? 40 : 20;
  const maxPicks = risk === 'safe' ? 3 : risk === 'balanced' ? 5 : 8;

  const filtered = filteredByMarket.filter(p => p.probability >= minProb && p.odds > 1.05);
  const combos: Combo[] = [];

  for (let i = 0; i < 6; i++) {
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    const pickCount = 2 + Math.floor(Math.random() * (maxPicks - 1));
    const uniquePicks: Pick[] = [];
    const usedMatches = new Set();
    
    for (const p of shuffled) {
      if (!usedMatches.has(p.matchId) && uniquePicks.length < pickCount) {
        usedMatches.add(p.matchId); uniquePicks.push(p);
      }
    }
    
    if (uniquePicks.length >= 2) {
      const tOdds = uniquePicks.reduce((acc, p) => acc * p.odds, 1);
      const tProb = uniquePicks.reduce((acc, p) => acc * (p.probability / 100), 1) * 100;
      combos.push({
        id: crypto.randomUUID(), picks: uniquePicks,
        totalOdds: Math.round(tOdds * 100) / 100, totalProbability: Math.round(tProb * 10) / 10,
        stake, potentialWin: Math.round(tOdds * stake * 100) / 100, riskLevel: risk
      });
    }
  }
  return combos.sort((a, b) => b.potentialWin - a.potentialWin).slice(0, 3); // Take top 3
}

export default function App() {
  const { apiKey, setApiKey, removeApiKey, selectedLeagues, risk, stake, selectedMarket, addHistoryCombos } = useComboStore();
  const [inputKey, setInputKey] = useState('');
  const [combos, setCombos] = useState<Combo[]>([]);

  const activeApiKey = apiKey || (import.meta as any).env.VITE_ODDS_API_KEY || '';

  // The Renderer & Networker: Data is fetched via TanStack Query and validated with Zod
  const { data: matches = [], isLoading, isFetching, refetch, isError, error } = useOddsApi(selectedLeagues, activeApiKey);

  const handleSaveKey = () => {
    if (inputKey.trim()) setApiKey(inputKey.trim());
  };

  const handleGenerate = () => {
    if (matches.length === 0) return;
    playGenerateSound();
    const newCombos = generateAlgorithmicCombos(matches, risk, stake, selectedMarket);
    setCombos(newCombos);
    
    // Optimistic History Update
    addHistoryCombos(newCombos.map(c => ({
      ...c,
      date: new Date().toISOString(),
      status: 'pending'
    })));
  };

  if (!apiKey && !(import.meta as any).env.VITE_ODDS_API_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 relative">
        <div className="bg-orbs-container">
          <div className="orb orb-1"></div><div className="orb orb-2"></div>
        </div>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel max-w-md w-full p-12 text-center">
          <Lock size={48} className="text-brand-500 mx-auto mb-6" />
          <h2 className="font-display text-gradient text-3xl font-black mb-4">Restricted Access</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed font-semibold">
            Para cargar cuotas matemáticas reales necesitas tu clave de The-Odds API.
          </p>
          <input 
            type="password" 
            placeholder="API Key..." 
            value={inputKey} 
            onChange={(e) => setInputKey(e.target.value)}
            className="w-full p-4 mb-6 bg-black/50 border border-white/10 rounded-xl text-white outline-none font-mono focus:border-brand-500 transition-colors" 
          />
          <button onClick={handleSaveKey} className="btn-premium font-display w-full p-4 rounded-xl font-bold text-lg">
            Conectar Red Neural
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-16">
      <div className="bg-orbs-container">
        <div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div>
      </div>

      <motion.header 
        initial={{ y: -50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.6, ease: "easeOut" }} 
        className="portal-card mx-auto max-w-7xl mt-6 mb-8"
      >
        <div className="portal-card-inner px-8 py-6 flex justify-between items-center flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-[0_4px_20px_rgba(217,70,239,0.4)]">
              <Activity className="text-white" size={28} />
            </div>
            <div>
              <h1 className="font-display text-gradient text-3xl font-black leading-tight">CombiPro <span className="text-sm align-top text-white/50 font-mono">v2.0</span></h1>
              <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1 font-semibold">
                <div className={`w-2 h-2 rounded-full ${isFetching ? 'bg-yellow-400 shadow-[0_0_10px_#facc15]' : isError ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-emerald-400 shadow-[0_0_10px_#34d399]'}`} />
                {isFetching ? 'Sincronizando The-Odds API...' : isError ? 'Error en la conexión' : `${matches.length} partidos mapeados`}
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => refetch()} 
              disabled={isFetching} 
              className="glass-panel glass-panel-hover px-6 py-3 rounded-xl text-white font-bold flex items-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} /> {isFetching ? 'Calculando...' : 'Recargar Red'}
            </button>
            {apiKey && (
               <button onClick={removeApiKey} className="glass-panel glass-panel-hover p-3 rounded-xl text-rose-500 cursor-pointer" title="Desconectar">
                 <XCircle size={20} />
               </button>
            )}
          </div>
        </div>
      </motion.header>

      <motion.main 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="max-w-7xl mx-auto px-6"
      >
        {isError && (
          <div className="mb-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 font-bold">
            ⚠️ Error crítico de sincronización: {(error as Error).message}. Comprueba tu API Key o los límites de cuota.
          </div>
        )}

        <SettingsPanel />

        <motion.button 
          whileHover={{ scale: matches.length > 0 ? 1.01 : 1 }} 
          whileTap={{ scale: matches.length > 0 ? 0.98 : 1 }} 
          className="btn-premium font-display w-full py-6 rounded-[24px] text-2xl font-black uppercase tracking-[4px] mb-12 shadow-2xl" 
          onClick={handleGenerate} 
          disabled={matches.length === 0 || isFetching}
        >
          ⚡ Generar Combinadas Algorítmicas
        </motion.button>

        <ComboResults combos={combos} />

        <div className="opacity-80">
          <h3 className="font-display text-sm text-muted-foreground mb-4 uppercase tracking-[2px] font-bold">
            Snapshot Replicada en Tiempo Real ({matches.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 h-48 overflow-y-auto pr-2 custom-scrollbar">
            {matches.map(m => (
              <div key={m.id} className="glass-panel p-4 flex justify-between items-center rounded-xl">
                <div>
                  <div className="text-xs font-bold text-white/90">{m.homeTeam}</div>
                  <div className="text-xs font-bold text-white/90">{m.awayTeam}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-brand-400 font-bold tracking-wider">{m.leagueName}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold mt-1">
                    {new Date(m.commenceTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <HistoryPanel />
      </motion.main>
    </div>
  );
}
