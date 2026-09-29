import type { DatabaseClient } from "../Model";
import type { DashboardData } from "@/features/Dashboard/Model";

export async function getDashboardData(client: DatabaseClient, userId: string): Promise<DashboardData | null> {
  const [profile, goal, settings, levels, streak, learned, due] = await Promise.all([
    client.from("profiles").select("display_name,cefr_level,created_at,onboarding_completed_at").eq("user_id", userId).single(),
    client.from("daily_goals").select("target_minutes").eq("user_id", userId).single(),
    client.from("user_settings").select("timezone").eq("user_id", userId).single(),
    client.from("user_levels").select("total_xp,level").eq("user_id", userId).maybeSingle(),
    client.from("streaks").select("current_days").eq("user_id", userId).maybeSingle(),
    client.from("user_vocabulary").select("word_id", { count: "exact", head: true }).eq("user_id", userId),
    client.from("user_vocabulary").select("word_id", { count: "exact", head: true }).eq("user_id", userId).lte("next_review_at", new Date().toISOString()),
  ]);
  if (profile.error || goal.error || !profile.data || !goal.data || !profile.data.onboarding_completed_at) return null;
  const timezone = settings.data?.timezone ?? "America/Sao_Paulo";
  const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const { data: today } = await client.from("user_daily_progress").select("activity_seconds,answers").eq("user_id", userId).eq("local_date", localDate).maybeSingle();
  return {
    userId,
    name: profile.data.display_name, cefrLevel: profile.data.cefr_level,
    targetMinutes: goal.data.target_minutes, startedAt: profile.data.created_at,
    totalXp: levels.data?.total_xp ?? 0, level: levels.data?.level ?? 1,
    streakDays: streak.data?.current_days ?? 0, learnedWords: learned.count ?? 0,
    dueWords: due.count ?? 0, todaySeconds: today?.activity_seconds ?? 0, todayAnswers: today?.answers ?? 0,
  };
}
