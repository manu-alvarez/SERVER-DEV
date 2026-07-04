import { useQuery } from '@tanstack/react-query';
import { Match } from '../types';
import { oddsApiResponseSchema } from '../schemas/oddsSchema';
import { LEAGUES } from '../constants'; // I'll need to create this or import it

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4/sports';

const fetchOdds = async (leagues: string[], apiKey: string): Promise<Match[]> => {
  if (!apiKey || leagues.length === 0) return [];
  
  const promises = leagues.map(async (league) => {
    const res = await fetch(`${ODDS_API_BASE}/${league}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h,totals&oddsFormat=decimal`);
    
    if (!res.ok) {
      if (res.status === 401) throw new Error('Invalid API Key');
      if (res.status === 429) throw new Error('Rate Limit Exceeded');
      throw new Error(`API Error: ${res.statusText}`);
    }
    
    const rawData = await res.json();
    
    // Zod validation (Strict checking)
    const parsedData = oddsApiResponseSchema.parse(rawData);
    
    return parsedData.map(event => {
      const bookmaker = event.bookmakers?.[0]?.markets;
      const h2h = bookmaker?.find(m => m.key === 'h2h')?.outcomes;
      const totals = bookmaker?.find(m => m.key === 'totals')?.outcomes;
      
      const over25Price = totals?.find(o => o.name === 'Over')?.price || 1.80;
      const under25Price = totals?.find(o => o.name === 'Under')?.price || 2.00;
      
      const home = h2h?.find(o => o.name === event.home_team)?.price || 2.00;
      const draw = h2h?.find(o => o.name === 'Draw')?.price || 3.30;
      const away = h2h?.find(o => o.name === event.away_team)?.price || 3.00;

      return {
        id: event.id, 
        homeTeam: event.home_team, 
        awayTeam: event.away_team,
        league, 
        leagueName: LEAGUES.find(l => l.key === league)?.name || league,
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
      } as Match;
    }).filter(m => m.odds.home && m.odds.draw && m.odds.away);
  });
  
  const results = await Promise.allSettled(promises);
  
  // Aggregate successful results and ignore failures
  const matches = results
    .filter((r): r is PromiseFulfilledResult<Match[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);
    
  return matches;
};

export function useOddsApi(leagues: string[], apiKey: string) {
  return useQuery({
    queryKey: ['odds', leagues, apiKey],
    queryFn: () => fetchOdds(leagues, apiKey),
    enabled: !!apiKey && leagues.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
