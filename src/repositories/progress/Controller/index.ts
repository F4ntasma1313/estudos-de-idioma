import type { DatabaseClient } from "../Model";
import type { ProgressData, Achievement } from "@/features/Progress/Model";

export async function getProgressData(client: DatabaseClient, userId: string): Promise<ProgressData> {
  const [levels, streak, learned, mastered, days, earned] = await Promise.all([
    client.from("user_levels").select("total_xp,level").eq("user_id", userId).maybeSingle(),
    client.from("streaks").select("current_days").eq("user_id", userId).maybeSingle(),
    client.from("user_vocabulary").select("word_id", { count: "exact", head: true }).eq("user_id", userId),
    client.from("user_vocabulary").select("word_id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "mastered"),
    client.from("user_daily_progress").select("local_date,activity_seconds,answers,correct_answers,xp_earned").eq("user_id", userId).order("local_date", { ascending: false }).limit(30),
    client.from("user_achievements").select("achievement_id,earned_at").eq("user_id", userId).order("earned_at", { ascending: false }).limit(10),
  ]);
  const achievementIds = (earned.data ?? []).map((item) => item.achievement_id as string);
  const catalog = achievementIds.length ? await client.from("achievements").select("id,title,description,rarity").in("id", achievementIds) : { data: [], error: null };
  const byId = new Map((catalog.data ?? []).map((item) => [item.id, item]));
  const achievements: Achievement[] = (earned.data ?? []).flatMap((item) => { const definition = byId.get(item.achievement_id); return definition ? [{ ...definition, earned_at: item.earned_at }] : []; });
  const rows = days.data ?? [];
  return {
    totalXp: levels.data?.total_xp ?? 0, level: levels.data?.level ?? 1,
    streakDays: streak.data?.current_days ?? 0, learnedWords: learned.count ?? 0, masteredWords: mastered.count ?? 0,
    totalAnswers: rows.reduce((sum, day) => sum + day.answers, 0), correctAnswers: rows.reduce((sum, day) => sum + day.correct_answers, 0),
    days: rows, achievements,
  };
}
