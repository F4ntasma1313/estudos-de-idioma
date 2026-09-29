import type { DatabaseClient } from "../Model";
import type { z } from "zod";
import type { subscriptionSchema } from "@/features/Push/Model";

export async function saveSubscription(client: DatabaseClient, userId: string, subscription: z.infer<typeof subscriptionSchema>, userAgent: string | null) {
  const { error } = await client.from("push_subscriptions").upsert({ user_id: userId, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, user_agent: userAgent?.slice(0, 300) ?? null, last_used_at: new Date().toISOString() }, { onConflict: "endpoint" });
  if (error) throw error;
  const settings = await client.from("user_settings").update({ push_enabled: true }).eq("user_id", userId);
  if (settings.error) throw settings.error;
}

export async function removeSubscription(client: DatabaseClient, userId: string, endpoint: string) {
  const { error } = await client.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", endpoint);
  if (error) throw error;
  const { count } = await client.from("push_subscriptions").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if (!count) await client.from("user_settings").update({ push_enabled: false }).eq("user_id", userId);
}
