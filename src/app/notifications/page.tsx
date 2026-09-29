import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotifications } from "@/repositories/notifications";
import { Notifications } from "@/features/Notifications";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const { error } = await searchParams;
  try { const items = await getNotifications(client, user.id); return <Notifications items={items} error={!!error} />; }
  catch { return <Notifications items={[]} loadError />; }
}
