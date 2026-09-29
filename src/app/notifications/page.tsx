import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotifications } from "@/repositories/notifications";
import { Notifications } from "@/features/Notifications";
import type { NotificationItem } from "@/features/Notifications/Model";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const { error } = await searchParams;
  let items: NotificationItem[] = [];
  let loadError = false;
  try { items = await getNotifications(client, user.id); }
  catch { loadError = true; }
  return <Notifications items={items} error={!!error} loadError={loadError} />;
}
