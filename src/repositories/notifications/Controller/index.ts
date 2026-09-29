import type { DatabaseClient } from "../Model";
import type { NotificationItem } from "@/features/Notifications/Model";

export async function getNotifications(client: DatabaseClient, userId: string): Promise<NotificationItem[]> {
  const { data, error } = await client.from("notifications").select("id,type,title,message,data,read_at,created_at")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []).map((item) => ({ id: item.id, type: item.type, title: item.title, message: item.message,
    path: typeof item.data?.path === "string" && /^\/(dashboard|study|review|lessons|progress|vocabulary)(\/.*)?$/.test(item.data.path) ? item.data.path : null,
    readAt: item.read_at, createdAt: item.created_at }));
}

export async function markRead(client: DatabaseClient, notificationId: string): Promise<void> {
  const { error } = await client.rpc("mark_notification_read", { p_notification_id: notificationId });
  if (error) throw error;
}
