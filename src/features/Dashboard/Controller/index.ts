import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/repositories/dashboard";

export async function loadDashboard() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { status: "unauthorized" as const };
  const data = await getDashboardData(client, user.id);
  if (!data) return { status: "onboarding" as const };
  return { status: "ready" as const, data };
}
