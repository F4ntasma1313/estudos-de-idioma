import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/repositories/settings";
import { Settings } from "@/features/Settings";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const query = await searchParams;
  return <Settings data={await getSettings(client, user.id)} saved={query.saved === "1"} error={!!query.error} />;
}
