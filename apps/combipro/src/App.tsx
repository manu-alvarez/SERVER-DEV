import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, RefreshCw, Lock, Trophy, Globe, Activity, 
  Target, ShieldCheck, Scale, Flame, XCircle, 
  Goal, Clock, ArrowRightLeft, AlignVerticalSpaceAround
} from 'lucide-react';

// ============================================
// COMBIPRO — Ultra-Premium Combo Generator
// ============================================

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4/sports';

import { Match, Pick, Combo, HistoryCombo } from './types';
import HistoryPanel from './components/HistoryPanel';

const LEAGUES = [
  { key: 'soccer_fifa_world_cup', name: 'Mundial de Fútbol', icon: Globe, color: 'var(--yellow)' },
  { key: 'soccer_uefa_champs_league', name: 'Champions League', icon: Trophy, color: 'var(--text)' },
  { key: 'soccer_uefa_europa_league', name: 'Europa League', icon: Trophy, color: 'var(--text)' },
  { key: 'soccer_epl', name: 'Premier', icon: Activity, color: 'var(--text)' },
  { key: 'soccer_spain_la_liga', name: 'LaLiga', icon: Activity, color: 'var(--text)' },
  { key: 'soccer_italy_serie_a', name: 'Serie A', icon: Activity, color: 'var(--text)' },
  { key: 'soccer_germany_bundesliga', name: 'Bundesliga', icon: Activity, color: 'var(--text)' },
  { key: 'soccer_france_ligue_one', name: 'Ligue 1', icon: Activity, color: 'var(--text)' },
  { key: 'soccer_netherlands_eredivisie', name: 'Eredivisie', icon: Activity, color: 'var(--text)' },
  { key: 'soccer_portugal_primeira_liga', name: 'Liga Portugal', icon: Activity, color: 'var(--text)' }
];

const MARKETS = [
  { key: 'auto', label: 'Automático', icon: Zap },
  { key: '1x2', label: '1X2 (Resultado)', icon: Target },
  { key: 'dc', label: 'Doble Oport.', icon: ArrowRightLeft },
  { key: 'dnb', label: 'Sin Empate', icon: AlignVerticalSpaceAround },
  { key: 'goals', label: 'Goles (+/-)', icon: Goal }
];

const RISKS = [
  { key: 'safe', label: 'Seguro (Alta Prob.)', icon: ShieldCheck, color: 'var(--green)' },
  { key: 'balanced', label: 'Medio (Equilibrado)', icon: Scale, color: 'var(--yellow)' },
  { key: 'turbo', label: 'Alto (Cuotas Altas)', icon: Flame, color: 'var(--red)' }
];

const RISK_DESCRIPTIONS = {
  safe: 'Prioriza pronósticos muy probables (>60%). Ideal para asegurar pequeñas ganancias de forma consistente.',
  balanced: 'Busca el equilibrio perfecto entre riesgo y beneficio combinando favoritos y valor.',
  turbo: 'Selecciona cuotas altas maximizando el retorno. Alto riesgo, alta recompensa potencial.'
};

async function fetchRealOdds(leagues: string[], apiKey: string): Promise<Match[]> {
  if (!apiKey) return [];
  try {
    const promises = leagues.map(async (league) => {
      const res = await fetch(`${ODDS_API_BASE}/${league}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,totals&oddsFormat=decimal`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((event: any) => {
        const bookmaker = event.bookmakers?.[0]?.markets;
        const h2h = bookmaker?.find((m: any) => m.key === 'h2h')?.outcomes;
        const totals = bookmaker?.find((m: any) => m.key === 'totals')?.outcomes;
        
        let over25Price = totals?.find((o: any) => o.name === 'Over')?.price || 1.80;
        let under25Price = totals?.find((o: any) => o.name === 'Under')?.price || 2.00;
        
        const home = h2h?.find((o: any) => o.name === event.home_team)?.price || 2.00;
        const draw = h2h?.find((o: any) => o.name === 'Draw')?.price || 3.30;
        const away = h2h?.find((o: any) => o.name === event.away_team)?.price || 3.00;

        return {
          id: event.id, homeTeam: event.home_team, awayTeam: event.away_team,
          league, leagueName: LEAGUES.find(l => l.key === league)?.name || league,
          commenceTime: event.commence_time,
          odds: {
            home, draw, away,
            over25: over25Price,
            under25: under25Price,
            dc1x: Math.round((1 / (1/home + 1/draw)) * 100) / 100,
            dcx2: Math.round((1 / (1/draw + 1/away)) * 100) / 100,
            dc12: Math.round((1 / (1/home + 1/away)) * 100) / 100,
            dnbHome: Math.round((home * (1 - 1/draw)) * 100) / 100 || 1.10,
            dnbAway: Math.round((away * (1 - 1/draw)) * 100) / 100 || 1.10
          },
        };
      }).filter((m: Match) => m.odds.home && m.odds.draw && m.odds.away);
    });
    const results = await Promise.all(promises);
    return results.flat();
  } catch (error) { return []; }
}

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

function generateCombos(matches: Match[], risk: 'safe' | 'balanced' | 'turbo', stake: number, marketFilter: string): Combo[] {
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

  let minProb = risk === 'safe' ? 60 : risk === 'balanced' ? 40 : 20;
  let maxPicks = risk === 'safe' ? 3 : risk === 'balanced' ? 5 : 8;

  const filtered = filteredByMarket.filter(p => p.probability >= minProb && p.odds > 1.05);
  const combos: Combo[] = [];

  for (let i = 0; i < 5; i++) {
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
  return combos.sort((a, b) => b.potentialWin - a.potentialWin);
}

// --- FADE ANIMATIONS ---
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('odds_api_key') || (import.meta as any).env.VITE_ODDS_API_KEY || '');
  const [inputKey, setInputKey] = useState('');
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(LEAGUES.map(l => l.key));
  const [risk, setRisk] = useState<'safe' | 'balanced' | 'turbo'>('balanced');
  const [stake, setStake] = useState(10);
  const [selectedMarket, setSelectedMarket] = useState<string>('auto');
  const [combos, setCombos] = useState<Combo[]>([]);
  const [history, setHistory] = useState<HistoryCombo[]>(() => {
    const saved = localStorage.getItem('combipro_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('combipro_history', JSON.stringify(history));
  }, [history]);

  const updateHistoryStatus = (id: string, status: 'pending' | 'won' | 'lost') => {
    setHistory(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const clearHistory = () => {
    if (confirm('¿Estás seguro de que quieres limpiar todo el historial?')) {
      setHistory([]);
    }
  };

  const fetchOdds = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setMatches(await fetchRealOdds(selectedLeagues, apiKey));
    setLoading(false);
  }, [selectedLeagues, apiKey]);

  useEffect(() => { if (apiKey) fetchOdds(); }, [apiKey, fetchOdds]);

  const saveApiKey = () => { if (inputKey.trim()) { localStorage.setItem('odds_api_key', inputKey.trim()); setApiKey(inputKey.trim()); } };
  const removeApiKey = () => { localStorage.removeItem('odds_api_key'); setApiKey(''); setMatches([]); setCombos([]); };

  const generate = () => {
    if (matches.length === 0) return;
    playGenerateSound();
    const newCombos = generateCombos(matches, risk, stake, selectedMarket);
    setCombos(newCombos);
    
    // Save to history
    const historyCombos: HistoryCombo[] = newCombos.map(c => ({
      ...c,
      date: new Date().toISOString(),
      status: 'pending'
    }));
    setHistory(prev => [...historyCombos, ...prev]);
  };

  const toggleLeague = (key: string) => setSelectedLeagues(p => p.includes(key) ? p.filter(l => l !== key) : [...p, key]);

  if (!apiKey) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="bg-orbs-container"><div className="orb orb-1"></div><div className="orb orb-2"></div></div>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ maxWidth: 450, padding: '3rem', textAlign: 'center' }}>
          <Lock size={48} color="var(--accent)" style={{ margin: '0 auto 1.5rem' }} />
          <h2 className="font-display text-gradient" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>Restricted Access</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>Para cargar cuotas matemáticas reales necesitas tu clave de The-Odds API.</p>
          <input type="password" placeholder="API Key..." value={inputKey} onChange={(e) => setInputKey(e.target.value)}
            style={{ width: '100%', padding: '1rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', outline: 'none', fontFamily: 'monospace' }} />
          <button onClick={saveApiKey} className="btn-premium font-display" style={{ width: '100%', padding: '1rem', borderRadius: 12, fontWeight: 700 }}>Conectar</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Background Orbs */}
      <div className="bg-orbs-container"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>

      {/* Header */}
      <motion.header initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} 
        className="portal-card" style={{ margin: '1.5rem auto', maxWidth: 1400, borderRadius: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0' }}>
        <div className="portal-card-inner" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 22, flexDirection: 'row' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(249, 115, 22, 0.4)' }}>
            <Activity color="white" size={24} />
          </div>
          <div>
            <h1 className="font-display text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1.1 }}>CombiPro</h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '4px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: loading ? 'var(--yellow)' : 'var(--green)', boxShadow: `0 0 10px ${loading ? 'var(--yellow)' : 'var(--green)'}` }} />
              {loading ? 'Sincronizando...' : `${matches.length} partidos mapeados`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={fetchOdds} disabled={loading} className="glass-panel glass-panel-hover" style={{ padding: '0.75rem 1.25rem', borderRadius: 12, color: 'var(--text)', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> {loading ? '...' : 'Recargar'}
          </button>
          {!((import.meta as any).env.VITE_ODDS_API_KEY) && (
             <button onClick={removeApiKey} className="glass-panel glass-panel-hover" style={{ padding: '0.75rem', borderRadius: 12, color: 'var(--red)' }} title="Desconectar"><XCircle size={18} /></button>
          )}
        </div>
        </div>
      </motion.header>

      <motion.main variants={containerVariants} initial="hidden" animate="show" style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.5rem', paddingBottom: '4rem' }}>
        
        {/* Settings Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <motion.div variants={itemVariants} className="portal-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0' }}>
            <div className="portal-card-inner" style={{ padding: '1.5rem' }}>
            <h3 className="font-display" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem' }}>Filtro de Competiciones</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', flex: 1 }}>
              {LEAGUES.map(league => {
                const active = selectedLeagues.includes(league.key);
                const Icon = league.icon;
                return (
                  <button key={league.key} onClick={() => toggleLeague(league.key)} style={{
                    padding: '0.75rem', background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${active ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                    borderRadius: 12, color: active ? league.color : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                  }}>
                    <Icon size={14} /> {league.name}
                  </button>
                )
              })}
            </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="portal-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0' }}>
            <div className="portal-card-inner" style={{ padding: '1.5rem' }}>
            <h3 className="font-display" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem' }}>Mercados a Combinar</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', flex: 1 }}>
              {MARKETS.map(market => {
                const active = selectedMarket === market.key;
                const Icon = market.icon;
                return (
                  <button key={market.key} onClick={() => setSelectedMarket(market.key)} style={{
                    padding: '0.75rem', background: active ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${active ? 'var(--accent)' : 'transparent'}`,
                    borderRadius: 12, color: active ? 'white' : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                  }}>
                    <Icon size={18} color={active ? 'var(--accent)' : 'var(--text-muted)'} /> {market.label}
                  </button>
                )
              })}
            </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="portal-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '0' }}>
            <div className="portal-card-inner" style={{ padding: '1.5rem', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <h3 className="font-display" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem' }}>Perfil de Riesgo</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                {RISKS.map(r => {
                  const active = risk === r.key;
                  const Icon = r.icon;
                  return (
                    <button key={r.key} onClick={() => setRisk(r.key as any)} style={{
                      padding: '0.8rem 1rem', background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                      borderRadius: 12, color: active ? 'white' : 'var(--text-muted)',
                      cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: '0.75rem'
                    }}>
                      <Icon size={16} color={active ? r.color : 'var(--text-muted)'} /> {r.label}
                    </button>
                  )
                })}
              </div>
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {(RISK_DESCRIPTIONS as any)[risk]}
                </p>
              </div>
            </div>
            <div style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Stake Inicial</span>
                <span className="font-display" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent)' }}>{stake}€</span>
              </div>
              <input type="range" value={stake} onChange={e => setStake(Number(e.target.value))} min={5} max={500} step={5} />
            </div>
            </div>
          </motion.div>
        </div>

        {/* Generate CTA */}
        <motion.button variants={itemVariants} whileHover={{ scale: matches.length > 0 ? 1.02 : 1 }} whileTap={{ scale: matches.length > 0 ? 0.98 : 1 }} 
          className="btn-premium font-display" onClick={generate} disabled={matches.length === 0} 
          style={{ width: '100%', padding: '1.5rem', borderRadius: 20, fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '3rem' }}>
          ⚡ Generar Combinadas
        </motion.button>

        {/* Results */}
        <AnimatePresence>
          {combos.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: '4rem' }}>
              <h2 className="font-display text-gradient" style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                Tickets Algorítmicos
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {combos.map((combo, i) => (
                  <motion.div key={combo.id} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }} className="portal-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div className="portal-card-inner" style={{ padding: '0' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div className="font-display text-gradient" style={{ fontSize: '1.25rem', fontWeight: 900 }}>TICKET #{i + 1}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{combo.picks.length} picks · Nivel {combo.riskLevel.toUpperCase()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>Cuota <span className="font-display" style={{ fontSize: '1.4rem', color: 'white', fontWeight: 800, marginLeft: '8px' }}>{combo.totalOdds.toFixed(2)}</span></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--green)', letterSpacing: '1px', marginTop: '4px' }}>Win <span className="font-display" style={{ fontSize: '1.1rem', fontWeight: 800, marginLeft: '8px' }}>{combo.potentialWin.toFixed(2)}€</span></div>
                      </div>
                    </div>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {combo.picks.map((pick, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.02)' }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '2px' }}>{pick.league}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{pick.match}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{pick.type} <ArrowRightLeft size={10} style={{margin:'0 4px', display:'inline'}} /> <span style={{ color: 'white', fontWeight: 600 }}>{pick.selection}</span></div>
                          </div>
                          <div className="font-display" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)', background: 'rgba(249, 115, 22, 0.1)', padding: '0.4rem 0.8rem', borderRadius: 8 }}>
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
          )}
        </AnimatePresence>

        {/* Database List Minimalist */}
        <motion.div variants={itemVariants} style={{ opacity: 0.7 }}>
          <h3 className="font-display" style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>DB Replicada ({matches.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {matches.map(m => (
              <div key={m.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{m.homeTeam}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{m.awayTeam}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>{m.leagueName}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(m.commenceTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* History Dashboard */}
        <HistoryPanel 
          history={history} 
          onUpdateStatus={updateHistoryStatus} 
          onClearHistory={clearHistory} 
        />
      </motion.main>
    </div>
  );
}
