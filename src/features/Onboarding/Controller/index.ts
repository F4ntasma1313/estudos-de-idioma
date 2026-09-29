"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveOnboarding } from "@/repositories/onboarding";
import { onboardingSchema } from "../Model";

export async function completeOnboarding(formData: FormData): Promise<void> {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const parsed = onboardingSchema.safeParse({ level: formData.get("level"), reason: formData.get("reason"), targetMinutes: formData.get("targetMinutes"), timezone: formData.get("timezone") });
  if (!parsed.success) redirect("/onboarding?error=invalid");
  try { await saveOnboarding(client, user.id, parsed.data); }
  catch { redirect("/onboarding?error=save"); }
  redirect("/dashboard");
}
