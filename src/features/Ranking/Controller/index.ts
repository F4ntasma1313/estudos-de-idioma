import { rankingMetrics, rankingPeriods, type RankingMetric, type RankingPeriod } from "../Model";

export function rankingFilters(input: { period?: string; metric?: string }): { period: RankingPeriod; metric: RankingMetric } {
  const period = rankingPeriods.find((item) => item === input.period) ?? "weekly";
  const metric = rankingMetrics.find((item) => item === input.metric) ?? "xp";
  return { period, metric };
}
