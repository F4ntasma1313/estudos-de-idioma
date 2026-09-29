import type { DatabaseClient } from "../Model";
import type { LeagueBoard, RankingPeriod, RankingMetric, RankingRow } from "@/features/Ranking/Model";

export async function getPublicRanking(client: DatabaseClient, period: RankingPeriod, metric: RankingMetric): Promise<RankingRow[]> {
  const { data, error } = await client.rpc("get_public_ranking", { p_period: period, p_metric: metric });
  if (error) throw error;
  return (data ?? []) as RankingRow[];
}

export async function getLeagueBoard(client: DatabaseClient): Promise<LeagueBoard> {
  const { data, error } = await client.rpc("get_league_board");
  if (error) throw error;
  return data as LeagueBoard;
}
