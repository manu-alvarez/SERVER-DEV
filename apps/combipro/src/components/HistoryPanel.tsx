import React from 'react';
import { HistoryCombo } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Props {
  history: HistoryCombo[];
  onUpdateStatus: (id: string, status: 'pending' | 'won' | 'lost') => void;
  onClearHistory: () => void;
}

export default function HistoryPanel({ history, onUpdateStatus, onClearHistory }: Props) {
  const totalCombos = history.length;
  const resolvedCombos = history.filter(c => c.status !== 'pending');
  const wonCombos = history.filter(c => c.status === 'won');
  
  const winRate = resolvedCombos.length > 0 
    ? Math.round((wonCombos.length / resolvedCombos.length) * 100) 
    : 0;

  const totalStaked = history.reduce((acc, c) => acc + c.stake, 0);
  const totalWon = history.reduce((acc, c) => c.status === 'won' ? acc + c.potentialWin : acc, 0);
  const totalLost = history.reduce((acc, c) => c.status === 'lost' ? acc + c.stake : acc, 0);
  
  // ROI based on resolved combos only
  const resolvedStaked = resolvedCombos.reduce((acc, c) => acc + c.stake, 0);
  const roi = resolvedStaked > 0 
    ? (((totalWon - resolvedStaked) / resolvedStaked) * 100).toFixed(1) 
    : 0;

  const netProfit = totalWon - resolvedStaked;

  if (history.length === 0) return null;

  return (
    <div style={{ marginTop: '4rem', marginBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="font-display text-gradient" style={{ fontSize: '2rem', fontWeight: 900 }}>
          Historial y Rendimiento
        </h2>
        <button 
          onClick={onClearHistory}
          style={{ background: 'transparent', border: '1px solid var(--red)', color: 'var(--red)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Limpiar Historial
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="portal-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Acierto</div>
          <div className="font-display" style={{ fontSize: '2.5rem', fontWeight: 900, color: winRate >= 50 ? 'var(--green)' : 'var(--red)' }}>
            {winRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{wonCombos.length} de {resolvedCombos.length} resueltas</div>
        </div>
        
        <div className="portal-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Beneficio Neto</div>
          <div className="font-display" style={{ fontSize: '2.5rem', fontWeight: 900, color: netProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)}€
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>En apuestas resueltas</div>
        </div>

        <div className="portal-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ROI (Retorno)</div>
          <div className="font-display" style={{ fontSize: '2.5rem', fontWeight: 900, color: Number(roi) >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {Number(roi) >= 0 ? '+' : ''}{roi}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sobre {resolvedStaked}€ invertidos</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <AnimatePresence>
          {history.map((combo, i) => (
            <motion.div key={combo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="portal-card" style={{ padding: '0', overflow: 'hidden', border: combo.status === 'won' ? '1px solid var(--green)' : combo.status === 'lost' ? '1px solid var(--red)' : '1px solid var(--border)' }}>
              <div className="portal-card-inner" style={{ padding: '0' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="font-display text-gradient" style={{ fontSize: '1.1rem', fontWeight: 900 }}>
                      {new Date(combo.date).toLocaleDateString()} - {new Date(combo.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {combo.picks.length} picks · Nivel {combo.riskLevel.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>
                      Cuota <span className="font-display" style={{ fontSize: '1.2rem', color: 'white', fontWeight: 800 }}>{combo.totalOdds.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '1px', marginTop: '2px' }}>
                      Stake <span style={{ color: 'white' }}>{combo.stake}€</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {combo.picks.map((pick, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.02)' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{pick.match}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {pick.type} <ArrowRightLeft size={10} style={{margin:'0 4px', display:'inline'}} /> <span style={{ color: 'white' }}>{pick.selection}</span>
                        </div>
                      </div>
                      <div className="font-display" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent)' }}>
                        {pick.odds.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.4)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="font-display" style={{ fontSize: '1.1rem', fontWeight: 800, color: combo.status === 'won' ? 'var(--green)' : combo.status === 'lost' ? 'var(--red)' : 'var(--text)' }}>
                    Potencial: {combo.potentialWin.toFixed(2)}€
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => onUpdateStatus(combo.id, 'won')}
                      style={{ background: combo.status === 'won' ? 'var(--green)' : 'rgba(255,255,255,0.05)', color: combo.status === 'won' ? '#000' : 'var(--green)', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Marcar como Ganada"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button 
                      onClick={() => onUpdateStatus(combo.id, 'lost')}
                      style={{ background: combo.status === 'lost' ? 'var(--red)' : 'rgba(255,255,255,0.05)', color: combo.status === 'lost' ? '#fff' : 'var(--red)', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Marcar como Perdida"
                    >
                      <XCircle size={18} />
                    </button>
                    <button 
                      onClick={() => onUpdateStatus(combo.id, 'pending')}
                      style={{ background: combo.status === 'pending' ? 'var(--yellow)' : 'rgba(255,255,255,0.05)', color: combo.status === 'pending' ? '#000' : 'var(--yellow)', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
