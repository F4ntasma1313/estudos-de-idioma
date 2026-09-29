import type { DatabaseClient } from "../Model";
import type { DashboardData } from "@/features/Dashboard/Model";

export async function getDashboardData(client: DatabaseClient, userId: string): Promise<DashboardData | null> {
  const [profile, goal] = await Promise.all([
    client.from("profiles").select("display_name,cefr_level,created_at,onboarding_completed_at").eq("user_id", userId).single(),
    client.from("daily_goals").select("target_minutes").eq("user_id", userId).single(),
  ]);
  if (profile.error || goal.error || !profile.data || !goal.data || !profile.data.onboarding_completed_at) return null;
  return { name: profile.data.display_name, cefrLevel: profile.data.cefr_level, targetMinutes: goal.data.target_minutes, startedAt: profile.data.created_at };
}
