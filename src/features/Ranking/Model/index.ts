export const rankingPeriods = ["daily","weekly","monthly","global"] as const;
export const rankingMetrics = ["xp","words","streak"] as const;
export type RankingPeriod = typeof rankingPeriods[number];
export type RankingMetric = typeof rankingMetrics[number];
export interface RankingRow { userId: string; name: string; score: number; place: number }
export interface LeagueBoard { membership: { participating: boolean; leagueId?: number; leagueName?: string; weekStart?: string }; rows: RankingRow[] }
export interface RankingViewProps { period: RankingPeriod; metric: RankingMetric; rows: RankingRow[]; league: LeagueBoard | null; userId: string; error?: boolean }
