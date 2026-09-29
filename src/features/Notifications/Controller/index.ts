"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { markRead } from "@/repositories/notifications";

export async function markNotificationRead(formData: FormData): Promise<void> {
  const parsed = z.uuid().safeParse(formData.get("notificationId"));
  if (!parsed.success) return;
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  try { await markRead(client, parsed.data); }
  catch { redirect("/notifications?error=read"); }
  revalidatePath("/notifications");
}
