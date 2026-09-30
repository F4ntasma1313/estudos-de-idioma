import type { ActivityProfile, ActivityLevel } from "@/features/Activities/Model";
import { activityLevels } from "@/features/Activities/Model";
import type { DatabaseClient } from "../Model";

export async function getActivityProfile(client: DatabaseClient, userId: string): Promise<ActivityProfile | null> {
  const [profile, settings, due] = await Promise.all([
    client.from("profiles").select("cefr_level,learning_reason,onboarding_completed_at").eq("user_id", userId).single(),
    client.from("user_settings").select("timezone").eq("user_id", userId).maybeSingle(),
    client.from("user_vocabulary").select("word_id", { count: "exact", head: true }).eq("user_id", userId).lte("next_review_at", new Date().toISOString()),
  ]);
  if (profile.error || !profile.data?.onboarding_completed_at) return null;
  const rawLevel = profile.data.cefr_level;
  const level: ActivityLevel = activityLevels.includes(rawLevel as ActivityLevel) ? rawLevel as ActivityLevel : "A1";
  return { userId, level, learningReason: profile.data.learning_reason, timezone: settings.data?.timezone ?? "America/Sao_Paulo", dueWords: due.count ?? 0 };
}

export async function listActivityCompletions(client: DatabaseClient, userId: string, date: string): Promise<string[]> {
  const { data, error } = await client.from("activity_completions").select("activity_slug").eq("user_id", userId).eq("local_date", date);
  if (error) throw error;
  return (data ?? []).map((row) => row.activity_slug);
}

export async function insertActivityCompletion(client: DatabaseClient, userId: string, date: string, slug: string, level: ActivityLevel): Promise<void> {
  const { error } = await client.from("activity_completions").insert({ user_id: userId, local_date: date, activity_slug: slug, cefr_level: level });
  if (error && error.code !== "23505") throw error;
}
