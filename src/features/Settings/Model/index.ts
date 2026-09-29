import { z } from "zod";

export const settingsSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  targetMinutes: z.coerce.number().int().min(5).max(240),
  timezone: z.string().min(3).max(80).refine((value) => { try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; } }),
  theme: z.enum(["light", "dark", "system"]),
  rankingPublic: z.boolean(), dailyReminderEnabled: z.boolean(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});
export interface SettingsData { userId: string; displayName: string; targetMinutes: number; timezone: string; theme: "light" | "dark" | "system"; rankingPublic: boolean; pushEnabled: boolean; dailyReminderEnabled: boolean; reminderTime: string }
export interface SettingsViewProps { data: SettingsData; saved?: boolean; error?: boolean }
