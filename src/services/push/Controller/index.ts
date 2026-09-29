import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";
import type { DispatchReport, LocalClock, ReminderSettings } from "../Model";

export function localClock(now: Date, timezone: string): LocalClock {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${values.year}-${values.month}-${values.day}`, minutes: Number(values.hour) * 60 + Number(values.minute) };
}

export function reminderIsDue(settings: ReminderSettings, now: Date, windowMinutes = 30): { due: boolean; localDate: string } {
  const local = localClock(now, settings.timezone);
  const [hours, minutes] = settings.reminder_time.slice(0, 5).split(":").map(Number);
  const target = hours * 60 + minutes;
  return { due: settings.daily_reminder_enabled && local.minutes >= target && local.minutes < target + windowMinutes, localDate: local.date };
}

export function createPushAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no job.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function dispatchReminders(now = new Date()): Promise<DispatchReport> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) throw new Error("Configure as chaves VAPID no job.");
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const client = createPushAdminClient();
  const report: DispatchReport = { checked: 0, due: 0, delivered: 0, failed: 0 };
  let cursor = "";
  for (;;) {
    let query = client.from("user_settings").select("user_id,timezone,reminder_time,daily_reminder_enabled,push_enabled").eq("daily_reminder_enabled", true).order("user_id").limit(200);
    if (cursor) query = query.gt("user_id", cursor);
    const { data: settings, error } = await query;
    if (error) throw error;
    if (!settings?.length) break;
    for (const raw of settings) {
      const item = raw as ReminderSettings;
      report.checked++;
      cursor = item.user_id;
      let schedule: { due: boolean; localDate: string };
      try { schedule = reminderIsDue(item, now); } catch { report.failed++; continue; }
      if (!schedule.due) continue;
      report.due++;
      const { data: progress } = await client.from("user_daily_progress").select("goal_reached_at").eq("user_id", item.user_id).eq("local_date", schedule.localDate).maybeSingle();
      if (progress?.goal_reached_at) continue;
      const { data: inserted, error: insertError } = await client.from("push_deliveries").insert({ user_id: item.user_id, kind: "daily_reminder", local_date: schedule.localDate }).select("id,status,attempts").maybeSingle();
      let delivery = inserted;
      if (insertError) {
        const existing = await client.from("push_deliveries").select("id,status,attempts").eq("user_id", item.user_id).eq("kind", "daily_reminder").eq("local_date", schedule.localDate).maybeSingle();
        delivery = existing.data;
      }
      if (!delivery || delivery.status === "sent" || delivery.attempts >= 3) continue;
      await client.from("push_deliveries").update({ attempts: delivery.attempts + 1, status: "pending" }).eq("id", delivery.id);
      if (inserted) await client.from("notifications").insert({ user_id: item.user_id, type: "daily_reminder", title: "Hora de estudar inglês", message: "Sua meta diária está esperando por você.", data: { path: "/study" } });
      const { data: subscriptions } = item.push_enabled ? await client.from("push_subscriptions").select("id,endpoint,p256dh,auth").eq("user_id", item.user_id) : { data: [] };
      let successful = 0;
      for (const subscription of subscriptions ?? []) {
        try {
          await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title: "Hora de estudar inglês", body: "Sua meta diária está esperando por você.", path: "/study" }), { TTL: 3600 });
          successful++;
          await client.from("push_subscriptions").update({ last_used_at: now.toISOString() }).eq("id", subscription.id);
        } catch (cause) {
          const status = typeof cause === "object" && cause !== null && "statusCode" in cause ? Number(cause.statusCode) : 0;
          if (status === 404 || status === 410) await client.from("push_subscriptions").delete().eq("id", subscription.id);
        }
      }
      if (!subscriptions?.length || successful > 0) {
        await client.from("push_deliveries").update({ status: "sent", sent_at: now.toISOString(), last_error: null }).eq("id", delivery.id);
        report.delivered++;
      } else {
        await client.from("push_deliveries").update({ status: "failed", last_error: "push_delivery_failed" }).eq("id", delivery.id);
        report.failed++;
      }
    }
    if (settings.length < 200) break;
  }
  return report;
}
