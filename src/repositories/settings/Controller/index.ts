import type { DatabaseClient } from "../Model";
import type { SettingsData } from "@/features/Settings/Model";
import type { z } from "zod";
import type { settingsSchema } from "@/features/Settings/Model";

export async function getSettings(client: DatabaseClient, userId: string): Promise<SettingsData> {
  const [profile, goal, settings] = await Promise.all([
    client.from("profiles").select("display_name").eq("user_id", userId).single(),
    client.from("daily_goals").select("target_minutes").eq("user_id", userId).single(),
    client.from("user_settings").select("timezone,theme,ranking_public,push_enabled,daily_reminder_enabled,reminder_time").eq("user_id", userId).single(),
  ]);
  if (profile.error || goal.error || settings.error || !profile.data || !goal.data || !settings.data) throw new Error("Não foi possível carregar configurações.");
  return { userId, displayName: profile.data.display_name, targetMinutes: goal.data.target_minutes,
    timezone: settings.data.timezone, theme: settings.data.theme, rankingPublic: settings.data.ranking_public,
    pushEnabled: settings.data.push_enabled, dailyReminderEnabled: settings.data.daily_reminder_enabled,
    reminderTime: String(settings.data.reminder_time).slice(0, 5) };
}

export async function updateSettings(client: DatabaseClient, userId: string, input: z.infer<typeof settingsSchema>) {
  const [profile, goal, settings] = await Promise.all([
    client.from("profiles").update({ display_name: input.displayName }).eq("user_id", userId),
    client.from("daily_goals").update({ target_minutes: input.targetMinutes }).eq("user_id", userId),
    client.from("user_settings").update({ timezone: input.timezone, theme: input.theme, ranking_public: input.rankingPublic, daily_reminder_enabled: input.dailyReminderEnabled, reminder_time: input.reminderTime }).eq("user_id", userId),
  ]);
  if (profile.error || goal.error || settings.error) throw new Error("Não foi possível salvar configurações.");
}
