"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateSettings } from "@/repositories/settings";
import { settingsSchema } from "../Model";

export async function saveSettings(formData: FormData): Promise<void> {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const parsed = settingsSchema.safeParse({
    displayName: formData.get("displayName"), targetMinutes: formData.get("targetMinutes"),
    timezone: formData.get("timezone"), theme: formData.get("theme"),
    rankingPublic: formData.get("rankingPublic") === "on",
    dailyReminderEnabled: formData.get("dailyReminderEnabled") === "on",
    reminderTime: formData.get("reminderTime"),
  });
  if (!parsed.success) redirect("/settings?error=invalid");
  try { await updateSettings(client, user.id, parsed.data); }
  catch { redirect("/settings?error=save"); }
  redirect("/settings?saved=1");
}
