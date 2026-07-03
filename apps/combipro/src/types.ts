export interface Match {
  id: string; homeTeam: string; awayTeam: string; league: string; leagueName: string; commenceTime: string;
  odds: {
    home: number; draw: number; away: number;
    over25: number; under25: number;
    btts: number; bttsNo: number;
    over05HT: number;
    dc1x: number; dcx2: number; dc12: number;
    dnb1?: number; dnb2?: number; dnbHome?: number; dnbAway?: number;
  };
}

export interface Pick {
  matchId: string; match: string; league: string;
  type: string; selection: string; odds: number; probability: number;
}

export interface Combo {
  id: string; picks: Pick[]; totalOdds: number; totalProbability: number;
  stake: number; potentialWin: number; riskLevel: 'safe' | 'balanced' | 'turbo';
}

export interface HistoryCombo extends Combo {
  date: string;
  status: 'pending' | 'won' | 'lost';
}
