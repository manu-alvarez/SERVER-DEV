import { 
  Trophy, Globe, Activity, Zap, Target, 
  ArrowRightLeft, AlignVerticalSpaceAround, Goal,
  ShieldCheck, Scale, Flame
} from 'lucide-react';

export const LEAGUES = [
  { key: 'soccer_fifa_world_cup', name: 'Mundial de Fútbol', icon: Globe, color: 'text-yellow-400' },
  { key: 'soccer_uefa_champs_league', name: 'Champions League', icon: Trophy, color: 'text-zinc-100' },
  { key: 'soccer_uefa_europa_league', name: 'Europa League', icon: Trophy, color: 'text-zinc-100' },
  { key: 'soccer_epl', name: 'Premier', icon: Activity, color: 'text-zinc-100' },
  { key: 'soccer_spain_la_liga', name: 'LaLiga', icon: Activity, color: 'text-zinc-100' },
  { key: 'soccer_italy_serie_a', name: 'Serie A', icon: Activity, color: 'text-zinc-100' },
  { key: 'soccer_germany_bundesliga', name: 'Bundesliga', icon: Activity, color: 'text-zinc-100' },
  { key: 'soccer_france_ligue_one', name: 'Ligue 1', icon: Activity, color: 'text-zinc-100' },
  { key: 'soccer_netherlands_eredivisie', name: 'Eredivisie', icon: Activity, color: 'text-zinc-100' },
  { key: 'soccer_portugal_primeira_liga', name: 'Liga Portugal', icon: Activity, color: 'text-zinc-100' }
];

export const MARKETS = [
  { key: 'auto', label: 'Automático', icon: Zap },
  { key: '1x2', label: '1X2 (Resultado)', icon: Target },
  { key: 'dc', label: 'Doble Oport.', icon: ArrowRightLeft },
  { key: 'dnb', label: 'Sin Empate', icon: AlignVerticalSpaceAround },
  { key: 'goals', label: 'Goles (+/-)', icon: Goal }
];

export const RISKS = [
  { key: 'safe', label: 'Seguro (Alta Prob.)', icon: ShieldCheck, color: 'text-emerald-400' },
  { key: 'balanced', label: 'Medio (Equilibrado)', icon: Scale, color: 'text-yellow-400' },
  { key: 'turbo', label: 'Alto (Cuotas Altas)', icon: Flame, color: 'text-rose-500' }
];

export const RISK_DESCRIPTIONS = {
  safe: 'Prioriza pronósticos muy probables (>60%). Ideal para asegurar pequeñas ganancias de forma consistente.',
  balanced: 'Busca el equilibrio perfecto entre riesgo y beneficio combinando favoritos y valor.',
  turbo: 'Selecciona cuotas altas maximizando el retorno. Alto riesgo, alta recompensa potencial.'
};
