import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLeagueBoard, getPublicRanking } from "@/repositories/ranking";
import { rankingFilters } from "@/features/Ranking/Controller";
import { Ranking } from "@/features/Ranking";
import type { LeagueBoard, RankingRow } from "@/features/Ranking/Model";

export default async function RankingPage({ searchParams }: { searchParams: Promise<{ period?: string; metric?: string }> }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const filters = rankingFilters(await searchParams);
  let rows: RankingRow[] = [];
  let league: LeagueBoard | null = null;
  let error = false;
  try { [rows, league] = await Promise.all([getPublicRanking(client, filters.period, filters.metric), getLeagueBoard(client)]); }
  catch { error = true; }
  return <Ranking {...filters} rows={rows} league={league} userId={user.id} error={error} />;
}
