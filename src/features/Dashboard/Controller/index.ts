import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/repositories/dashboard";
import { dailyActivity, localActivityDate } from "@/features/Activities/Controller";
import type { ActivityLevel, ActivityProfile } from "@/features/Activities/Model";

export async function loadDashboard() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { status: "unauthorized" as const };
  const data = await getDashboardData(client, user.id);
  if (!data) return { status: "onboarding" as const };
  const activityProfile: ActivityProfile = { userId: data.userId, level: data.cefrLevel as ActivityLevel, learningReason: data.learningReason, timezone: data.timezone, dueWords: data.dueWords };
  const date = localActivityDate(data.timezone);
  const daily = dailyActivity(activityProfile, date);
  const goalPercent = Math.min(100, Math.round(data.todaySeconds / (data.targetMinutes * 60) * 100));
  return { status: "ready" as const, data, daily, goalPercent };
}
